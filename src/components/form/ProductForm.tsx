import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {InputForm} from '../input/InputForm';
import {appColors, appStyles} from '../../styles/globalStyles';
import {TouchableButton} from '../button/TouchableButton';
import {Product} from '../../database/models/Product';
import {useForm} from '../../hooks/useForm';
import {Response} from '../../database/models/response/Response';

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
  const {form, errors, handleChange, handleSubmit, response} = useForm(
    initialForm,
    validateForm,
    onSubmit,
  );
  return (
    <View style={[appStyles.flexColumn, styles.container]}>
      <InputForm
        label="Codigo"
        placeholder="Ingresa un codigo"
        placeholderTextColor={appColors.gray}
        value={form.code}
        errors={errors.code}
        onChangeText={text => handleChange(text, 'code')}
        secureTextEntry={false}
        style={styles.input}
      />
      <InputForm
        label="Nombre"
        placeholder="Ingresa un nombre"
        placeholderTextColor={appColors.gray}
        value={form.name}
        errors={errors.name}
        onChangeText={text => handleChange(text, 'name')}
        secureTextEntry={false}
        style={styles.input}
        multiline={true}
      />
      <InputForm
        label="Descripción"
        placeholder="Ingresa una descripcion"
        placeholderTextColor={appColors.gray}
        value={form.description}
        errors={errors.description}
        onChangeText={text => handleChange(text, 'description')}
        secureTextEntry={false}
        style={[styles.input, styles.textArea]}
        multiline={true}
      />
      <InputForm
        label="Precio"
        placeholder="Ingresa un precio"
        placeholderTextColor={appColors.gray}
        value={form.price.toString()}
        errors={errors.price}
        onChangeText={text => handleChange(text, 'price')}
        secureTextEntry={false}
        style={styles.input}
        keyboardType="decimal-pad"
      />
      {!update ? (
        <InputForm
          label="Stock inicial"
          placeholder="Ingresa un stock inicial"
          placeholderTextColor={appColors.gray}
          value={form.stock.toString()}
          errors={errors.stock}
          onChangeText={text => handleChange(text, 'stock')}
          secureTextEntry={false}
          style={styles.input}
          keyboardType="numeric"
        />
      ) : (
        <View style={styles.stock}>
          <Text
            style={[
              appStyles.textDark,
              appStyles.subTitle,
              appStyles.textCenter,
            ]}>
            Stock actual: {form.stock}
          </Text>
        </View>
      )}
      <View>
        <TouchableButton
          onPress={handleSubmit}
          title="Guardar Datos"
          icon="send"
          iconColor={appColors.white}
          textStyle={[appStyles.subTitle]}
          styles={styles.button}
        />
      </View>
      {response && (
        <View>
          <Text style={[appStyles.textCenter, appStyles.subTitle]}>
            {response.message}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    borderBottomWidth: 1,
    color: appColors.black,
  },
  button: {
    backgroundColor: appColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginTop: 10,
  },
  stock: {
    marginVertical: 20,
  },
});
