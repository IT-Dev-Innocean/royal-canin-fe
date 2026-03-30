import { RegistrationFormProvider } from "@/context/RegistrationFormContext";
import { RegistrationFormView } from "@/components/registration/RegistrationFormView";

export default function RegistrationFormPage() {
  return (
    <RegistrationFormProvider>
      <RegistrationFormView />
    </RegistrationFormProvider>
  );
}
