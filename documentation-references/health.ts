import { API_URL, HEADERS } from "../utils/constant.ts";

const response = await fetch(`${API_URL}/health`, {
  method: "GET",
  headers: HEADERS,
});

console.log(await response.text());
