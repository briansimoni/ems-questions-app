import Profile from "../islands/Profile.tsx";
import { StreakStore } from "../lib/streak_store.ts";

import { User, UserStore } from "../lib/user_store.ts";
import { AppHandlers, AppProps } from "./_middleware.ts";

export const handler: AppHandlers = {
  async GET(req, ctx) {
    const user_id = ctx.state.session?.user_id;
    if (!user_id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userStore = await UserStore.make();
    const sreakStore = await StreakStore.make();
    const [user, streak] = await Promise.all([
      userStore.getUser(user_id),
      sreakStore.get(user_id),
    ]);
    return ctx.render({ user, streak, session: ctx.state.session });
  },
};

interface ProfileProps extends AppProps {
  user: User;
}

export default function (props: ProfileProps) {
  return (
    <Profile
      user={props.data.user}
      session={props.data.session}
      streak={props.data.streak}
    />
  );
}
