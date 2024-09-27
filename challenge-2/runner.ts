import { processCompanyList } from "./challenge";

/**
 * This is the entry point for the challenge.
 * This will run your code.
 */
(async () => {
    try {
      console.log("Starting process...");
      await processCompanyList();
      console.log("✅ Done!");
    } catch (error) {
      console.error("An error occurred:", error);
    }
  })();