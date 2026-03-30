import type {
  RegistrationApiResponse,
  RegistrationRequestBody,
} from "@/types/registration";

export async function submitRegistration(
  body: RegistrationRequestBody,
): Promise<RegistrationApiResponse> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as RegistrationApiResponse;
  return data;
}
