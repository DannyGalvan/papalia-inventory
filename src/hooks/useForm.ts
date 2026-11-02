import { useEffect, useState } from 'react';
import { Response } from '../database/models/response/Response';
import { getErrorMessage } from '../utils/getErrorMessage';

/** Validation errors keyed by form field name. */
export type FormErrors = Partial<Record<string, string>>;

/** Updates a single form field; values may be text, numbers or nested lists. */
export type UpdateFormField = (value: unknown, field: string) => void;

export const useForm = <T>(
  initialForm: T,
  validateForm: (form: T) => FormErrors,
  peticion: (form: T) => Promise<Response<T>>,
) => {
  const [form, setForm] = useState<T>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<Response<T> | null>(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange: UpdateFormField = (text, campo) => {
    const newForm: T = {
      ...form,
      [campo]: text,
    };
    setForm(newForm);
    setErrors(validateForm(newForm));
  };

  const handleBlur: UpdateFormField = (text, campo) => {
    handleChange(text, campo);
    setErrors(validateForm(form));
  };

  const handleSubmit = async () => {
    try {
      setResponse(null);
      const errorsValidate = validateForm(form);
      setErrors(errorsValidate);
      setLoading(true);
      if (Object.keys(errorsValidate).length === 0) {
        try {
          const result = await peticion(form);

          if (result.success) {
            setForm(initialForm);
          }

          setResponse(result);
        } catch (ex: unknown) {
          setResponse({
            success: false,
            message: getErrorMessage(ex, 'No se pudo completar la operación'),
            data: null,
          });
        }
      } else {
        setResponse(null);
      }
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      setResponse({
        success: false,
        message: getErrorMessage(error, 'No se pudo completar la operación'),
        data: null,
      });
    }
  };

  return {
    form,
    errors,
    loading,
    response,
    handleBlur,
    handleChange,
    handleSubmit,
  };
};
