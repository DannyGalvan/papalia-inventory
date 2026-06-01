import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Product } from '../../database/models/Product';
import { Response } from '../../database/models/response/Response';
import { useForm } from '../../hooks/useForm';
import { useImages } from '../../hooks/useImages';
import { useTheme } from '../../hooks/useTheme';
import { TouchableButton } from '../button/TouchableButton';
import { InputForm } from '../input/InputForm';

interface Props {
  initialForm: Product;
  onSubmit: (values: Product) => Promise<Response<Product>>;
  update?: boolean;
}

const validateForm = (form: Product) => {
  let errors: any = {};
  if (!form.code) {
    errors.code = 'El codigo es requerido';
  }
  if (!form.name) {
    errors.name = 'El nombre es requerido';
  }
  if (!form.description) {
    errors.description = 'La descripcion es requerida';
  }
  if (!form.price) {
    errors.price = 'El precio es requerido';
  }
  if (form.stock === undefined || form.stock === null) {
    errors.stock = 'El stock es requerido';
  }
  return errors;
};

export const ProductForm = ({initialForm, onSubmit, update}: Props) => {
  const {theme} = useTheme();
  const {uploadImage} = useImages();
  const noImage = require('../../assets/sin_imagen.png');

  const {form, errors, handleChange, handleSubmit, response} = useForm(
    initialForm,
    validateForm,
    onSubmit,
  );

  const handleSelectImage = async () => {
    uploadImage({
      updateForm: handleChange,
      nameImage: form.code,
      afterImage: form.image,
    });
  };

  const inputStyle = [
    styles.input,
    {borderBottomColor: theme.colors.border, color: theme.colors.text},
  ];

  const textAreaStyle = [
    styles.input,
    styles.textArea,
    {borderColor: theme.colors.border, color: theme.colors.text},
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <InputForm
            label="Codigo"
            placeholder="Ingresa un codigo"
            placeholderTextColor={theme.colors.disabled}
            value={form.code}
            errors={errors.code}
            onChangeText={text => handleChange(text, 'code')}
            secureTextEntry={false}
            style={inputStyle}
            colorText={{color: theme.colors.text}}
            readonly={update}
          />
          <InputForm
            label="Nombre"
            placeholder="Ingresa un nombre"
            placeholderTextColor={theme.colors.disabled}
            value={form.name}
            errors={errors.name}
            onChangeText={text => handleChange(text, 'name')}
            secureTextEntry={false}
            style={inputStyle}
            colorText={{color: theme.colors.text}}
            multiline={true}
          />
          <InputForm
            label="Descripción"
            placeholder="Ingresa una descripcion"
            placeholderTextColor={theme.colors.disabled}
            value={form.description}
            errors={errors.description}
            onChangeText={text => handleChange(text, 'description')}
            secureTextEntry={false}
            style={textAreaStyle}
            colorText={{color: theme.colors.text}}
            multiline={true}
          />
          <InputForm
            label="Precio"
            placeholder="Ingresa un precio"
            placeholderTextColor={theme.colors.disabled}
            value={form.price.toString()}
            errors={errors.price}
            onChangeText={text => handleChange(text, 'price')}
            secureTextEntry={false}
            style={inputStyle}
            colorText={{color: theme.colors.text}}
            keyboardType="decimal-pad"
          />
          {!update ? (
            <InputForm
              label="Stock inicial"
              placeholder="Ingresa un stock inicial"
              placeholderTextColor={theme.colors.disabled}
              value={form.stock.toString()}
              errors={errors.stock}
              onChangeText={text => handleChange(text, 'stock')}
              secureTextEntry={false}
              style={inputStyle}
              colorText={{color: theme.colors.text}}
              keyboardType="numeric"
            />
          ) : (
            <View style={styles.stock}>
              <Text
                style={[
                  styles.stockText,
                  {color: theme.colors.text},
                ]}>
                Inventario en existencia actual: {form.stock}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleSelectImage}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar imagen del producto"
            accessibilityHint="Abre la galería para elegir una imagen del producto">
            <Image
              style={[styles.image, {backgroundColor: theme.colors.border}]}
              source={form.image ? {uri: form.image} : noImage}
              accessibilityRole="image"
              accessibilityLabel={
                form.name
                  ? `Imagen del producto ${form.name}`
                  : 'Imagen del producto, sin imagen seleccionada'
              }
            />
          </TouchableOpacity>
          <TouchableButton
            onPress={handleSubmit}
            title="Guardar Datos"
            icon="send"
            iconColor="#FFFFFF"
            textStyle={[styles.buttonText]}
            styles={[styles.button, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg}]}
            accessibilityLabel="Guardar datos del producto"
            accessibilityHint="Guarda la información del producto"
          />
          {response && (
            <View style={styles.responseContainer}>
              <Text
                style={[
                  styles.responseText,
                  {color: response.success ? theme.colors.success : theme.colors.error},
                ]}>
                {response.message}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  stock: {
    marginVertical: 16,
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  responseContainer: {
    marginVertical: 8,
  },
  responseText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
