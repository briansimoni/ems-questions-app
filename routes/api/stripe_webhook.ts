import { ProductStore, ProductVariant } from "../../lib/product_store.ts";
import { AppHandlers } from "../_middleware.ts";
import Stripe from "npm:stripe";

const stripeSigningKey = Deno.env.get("STRIPE_SIGNING_SECRET");
const stripeAPIKey = Deno.env.get("STRIPE_API_KEY");
const printfulSecret = Deno.env.get("PRINTFUL_SECRET");

export const handler: AppHandlers = {
  POST: async (req) => {
    if (!stripeSigningKey) {
      throw new Error("STRIPE_SIGNING_SECRET is not set");
    }
    if (!stripeAPIKey) {
      throw new Error("STRIPE_API_KEY is not set");
    }
    if (!printfulSecret) {
      throw new Error("PRINTFUL_SECRET is not set");
    }
    const stripeClient = new Stripe(stripeAPIKey);
    if (req.body === null) {
      throw new Error("Request body is null");
    }
    const body = await req.text();
    const event = await stripeClient.webhooks.constructEventAsync(
      body,
      req.headers.get("stripe-signature") ?? "",
      stripeSigningKey,
    );
    console.log(event);
    if (event.type === "checkout.session.completed") {
      const session = await stripeClient.checkout.sessions.retrieve(
        event.data.object.id,
      );

      const lineItems = [];
      let lineItemsPage = await stripeClient.checkout.sessions.listLineItems(
        session.id,
      );
      lineItems.push(...lineItemsPage.data);
      while (lineItemsPage.has_more && lineItems[lineItems.length - 1].id) {
        lineItemsPage = await stripeClient.checkout.sessions.listLineItems(
          session.id,
          { starting_after: lineItemsPage.data.pop()?.id },
        );
        lineItems.push(...lineItemsPage.data);
      }

      for (const item of lineItems) {
        console.log(item);
        // that is the thing that they bought
        // item.price?.product
        // TODO: add a secondary index for stripe product ID
        const productStore = await ProductStore.make();
        const product = await productStore.listProducts();
        const variants = await productStore.listProductVariants(
          product[0].printful_id,
        );
        const variant = variants.find((i) =>
          i.stripe_product_id === item.price?.product
        );
        if (variant === undefined) {
          throw new Error(`Item ${item.price?.id} not found`);
        }
        await submitOrder(
          variant,
          session.collected_information?.shipping_details!,
        );
      }
    }
    // all good! tell stripe that we successfully processed the webhook
    return new Response();
  },
};

async function submitOrder(
  variant: ProductVariant,
  shippingDetails: Stripe.Checkout.Session.CollectedInformation.ShippingDetails,
  customerEmail?: string,
) {
  await fetch("https://api.printful.com/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Authorization": `Bearer ${printfulSecret}`,
    },
    body: JSON.stringify({
      "recipient": {
        "name": shippingDetails.name,
        "address1": shippingDetails.address?.line1,
        "city": shippingDetails.address?.line2,
        "state_code": shippingDetails.address?.state,
        "zip": shippingDetails.address?.postal_code,
        "email": customerEmail,
        "country_code": shippingDetails.address?.country,
      },
      "items": [
        {
          "variant_id": variant.variant_id,
          "quantity": 1,
          "product_template_id": variant.product_template_id,
        },
      ],
    }),
  });
}
