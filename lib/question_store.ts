import { getKv } from "./kv.ts";

export interface Question {
  id: string;
  hash: string;
  created_at: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export class QuestionStore {
  private constructor(private kv: Deno.Kv) {}

  static async make(kv?: Deno.Kv) {
    if (!kv) {
      kv = await getKv();
    }
    return new QuestionStore(kv);
  }

  async getCount(): Promise<number> {
    const result = await this.kv.get<number>(["emt", "question_count"]);
    return result.value || 0;
  }

  /**
   * adds a question to the store. This is also responsible for creating the id
   * and the question hash
   */
  async addQuestion(question: Partial<Question>) {
    // Get the current count or default to 0
    const count = await this.getCount();
    const id = count + 1;
    // Assign ID and created_at
    question.id = String(id);
    question.created_at = new Date().toISOString();

    // Generate a SHA-256 hash of the questions
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(question.question),
    );

    // Convert hash buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    question.hash = hashHex;

    // Atomic transaction with chained .set() calls
    const transaction = this.kv.atomic()
      .set(["emt", "questions", question.id], question)
      .set(["emt", "question_count"], count + 1);

    const result = await transaction.commit();
    if (!result.ok) {
      throw new Error("Failed to add question");
    }
    return question as Question;
  }

  async deleteQuestion(id: string) {
    const count = await this.getCount();
    const tx = this.kv.atomic()
      .delete(["emt", "questions", id])
      .set(["emt", "question_count"], count - 1);
    await tx.commit();
  }

  async getQuestion(id: string) {
    const question =
      (await this.kv.get<Question>(["emt", "questions", id])).value;
    if (!question) {
      throw new Error("No question found");
    }
    return question;
  }

  async getRandomQuestion(): Promise<Question> {
    const count = await this.getCount();
    const randomIndex = Math.floor(Math.random() * count) + 1;
    const question =
      (await this.kv.get<Question>(["emt", "questions", String(randomIndex)]))
        .value;
    if (!question) {
      throw new Error("No question found");
    }
    return question;
  }

  async listQuestions(): Promise<Question[]> {
    const entries = this.kv.list<Question>({ prefix: ["emt", "questions"] });
    const questions: Question[] = [];
    for await (const entry of entries) {
      questions.push(entry.value);
    }
    return questions;
  }

  closeConnection() {
    this.kv.close();
  }
}
