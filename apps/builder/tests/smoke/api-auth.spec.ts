import { expect, test } from "@playwright/test";

const sampleProjectId = "00000000-0000-4000-8000-000000000000";

test("attachment APIs reject unauthenticated access", async ({ request }) => {
  const list = await request.get(`/api/attachments/list?projectId=${sampleProjectId}`);
  expect(list.status()).toBeGreaterThanOrEqual(300);
  expect(list.status()).toBeLessThan(500);

  const intent = await request.post("/api/attachments/intent", {
    data: {
      projectId: sampleProjectId,
      fileName: "reference.png",
      contentType: "image/png",
      fileSize: 12,
    },
  });
  expect(intent.status()).toBeGreaterThanOrEqual(300);
  expect(intent.status()).toBeLessThan(500);
});
