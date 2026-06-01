import { useEffect, useState } from 'react';
import { Response } from '../database/models/response/Response';

export const useForm = <T>(
  initialForm: T,
  validateForm: (form: T) => any,
  peticion: (form: T) => Promise<Response<T>>,
) => {
  const [form, setForm] = useState<T>(initialForm);
  const [errors, setErrors] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<Response<T> | null>(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (text: any, campo: string) => {
    const newForm: T = {
      ...form,
      [campo]: text,
    };
    setForm(newForm);
    setErrors(validateForm(newForm));
  };

  const handleBlur = (text: any, campo: string) => {
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

          result.success && setForm(initialForm);

          setResponse(result);
        } catch (ex: any) {
          setResponse({
            success: false,
            message: ex?.message || 'No se pudo completar la operación',
            data: null as any,
          });
        }
      } else {
        setResponse(null);
      }
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setResponse({
        success: false,
        message: error?.message || 'No se pudo completar la operación',
        data: null as any,
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
