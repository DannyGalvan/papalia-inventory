import React, { useEffect, useState } from 'react';
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
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/Ionicons';
import { Category } from '../../database/models/Category';
import { Product } from '../../database/models/Product';
import { Response } from '../../database/models/response/Response';
import { Supplier } from '../../database/models/Supplier';
import { UnitOfMeasure } from '../../database/models/UnitOfMeasure';
import { getActiveCategories } from '../../database/repository/CategoryRepository';
import { getActiveSuppliers } from '../../database/repository/SupplierRepository';
import { getActiveUnits } from '../../database/repository/UnitOfMeasureRepository';
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

type NullableItem = {id: number | null; label: string};

const NO_CATEGORY: NullableItem = {id: null, label: 'Sin categoría'};
const NO_SUPPLIER: NullableItem = {id: null, label: 'Sin proveedor'};
const NO_UNIT: NullableItem = {id: null, label: 'Unidades (uds)'};

const validateForm = (form: Product) => {
  const errors: any = {};
  if (!form.code) { errors.code = 'El codigo es requerido'; }
  if (!form.name) { errors.name = 'El nombre es requerido'; }
  if (!form.description) { errors.description = 'La descripcion es requerida'; }
  if (!form.price) { errors.price = 'El precio es requerido'; }
  if (form.stock === undefined || form.stock === null) { errors.stock = 'El stock es requerido'; }
  return errors;
};

export const ProductForm = ({initialForm, onSubmit, update}: Props) => {
  const {theme} = useTheme();
  const {uploadImage} = useImages();
  const noImage = require('../../assets/sin_imagen.png');

  const [categories, setCategories] = useState<NullableItem[]>([NO_CATEGORY]);
  const [suppliers, setSuppliers] = useState<NullableItem[]>([NO_SUPPLIER]);
  const [units, setUnits] = useState<NullableItem[]>([NO_UNIT]);

  useEffect(() => {
    Promise.all([
      getActiveCategories(),
      getActiveSuppliers(),
      getActiveUnits(),
    ]).then(([cats, sups, uns]) => {
      setCategories([NO_CATEGORY, ...cats.map((c: Category) => ({id: c.id, label: c.name}))]);
      setSuppliers([NO_SUPPLIER, ...sups.map((s: Supplier) => ({id: s.id, label: s.name}))]);
      setUnits([NO_UNIT, ...uns.map((u: UnitOfMeasure) => ({id: u.id, label: `${u.name} (${u.abbreviation})`}))]);
    });
  }, []);

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

  const dropdownBtnStyle = [
    styles.dropdownBtn,
    {borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
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
              <Text style={[styles.stockText, {color: theme.colors.text}]}>
                Inventario en existencia actual: {form.stock}
              </Text>
            </View>
          )}

          {/* ── Categoría ── */}
          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
              CATEGORÍA
            </Text>
            <SelectDropdown
              data={categories}
              defaultValue={categories.find(c => c.id === form.categoryId) ?? NO_CATEGORY}
              onSelect={item => handleChange(item.id, 'categoryId')}
              rowTextForSelection={item => item.label}
              buttonTextAfterSelection={item => item.label}
              buttonStyle={dropdownBtnStyle}
              buttonTextStyle={{color: theme.colors.text, fontSize: 14, textAlign: 'left'}}
              dropdownStyle={{backgroundColor: theme.colors.surface}}
              rowStyle={{backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}}
              rowTextStyle={{color: theme.colors.text}}
              selectedRowStyle={{backgroundColor: theme.colors.primary + '22'}}
              selectedRowTextStyle={{color: theme.colors.primary, fontWeight: '600'}}
              dropdownOverlayColor="transparent"
              renderDropdownIcon={() => <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />}
            />
          </View>

          {/* ── Proveedor ── */}
          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
              PROVEEDOR
            </Text>
            <SelectDropdown
              data={suppliers}
              defaultValue={suppliers.find(s => s.id === form.supplierId) ?? NO_SUPPLIER}
              onSelect={item => handleChange(item.id, 'supplierId')}
              rowTextForSelection={item => item.label}
              buttonTextAfterSelection={item => item.label}
              buttonStyle={dropdownBtnStyle}
              buttonTextStyle={{color: theme.colors.text, fontSize: 14, textAlign: 'left'}}
              dropdownStyle={{backgroundColor: theme.colors.surface}}
              rowStyle={{backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}}
              rowTextStyle={{color: theme.colors.text}}
              selectedRowStyle={{backgroundColor: theme.colors.primary + '22'}}
              selectedRowTextStyle={{color: theme.colors.primary, fontWeight: '600'}}
              dropdownOverlayColor="transparent"
              renderDropdownIcon={() => <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />}
              search
              searchPlaceHolder="Buscar proveedor..."
              searchPlaceHolderColor={theme.colors.textSecondary}
              searchInputStyle={{backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8}}
              searchInputTxtStyle={{color: theme.colors.text}}
            />
          </View>

          {/* ── Unidad de medida ── */}
          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
              UNIDAD DE MEDIDA
            </Text>
            <SelectDropdown
              data={units}
              defaultValue={units.find(u => u.id === form.unitId) ?? NO_UNIT}
              onSelect={item => handleChange(item.id, 'unitId')}
              rowTextForSelection={item => item.label}
              buttonTextAfterSelection={item => item.label}
              buttonStyle={dropdownBtnStyle}
              buttonTextStyle={{color: theme.colors.text, fontSize: 14, textAlign: 'left'}}
              dropdownStyle={{backgroundColor: theme.colors.surface}}
              rowStyle={{backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}}
              rowTextStyle={{color: theme.colors.text}}
              selectedRowStyle={{backgroundColor: theme.colors.primary + '22'}}
              selectedRowTextStyle={{color: theme.colors.primary, fontWeight: '600'}}
              dropdownOverlayColor="transparent"
              renderDropdownIcon={() => <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />}
            />
          </View>

          {/* ── Imagen ── */}
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
              accessibilityLabel={form.name ? `Imagen del producto ${form.name}` : 'Sin imagen seleccionada'}
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
              <Text style={[styles.responseText, {color: response.success ? theme.colors.success : theme.colors.error}]}>
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
  flex: {flex: 1},
  scrollContent: {flexGrow: 1, paddingBottom: 40},
  container: {width: '100%', paddingHorizontal: 20},
  input: {borderBottomWidth: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 16},
  textArea: {height: 80, textAlignVertical: 'top', borderWidth: 1, borderRadius: 8, marginTop: 8, paddingHorizontal: 12},
  button: {paddingVertical: 14, paddingHorizontal: 20, marginVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  buttonText: {fontSize: 16, fontWeight: 'bold', color: '#FFFFFF'},
  stock: {marginVertical: 16},
  stockText: {fontSize: 16, fontWeight: 'bold', textAlign: 'center'},
  imageContainer: {alignItems: 'center', marginVertical: 16},
  image: {width: 180, height: 180, resizeMode: 'contain', borderRadius: 8},
  responseContainer: {marginVertical: 8},
  responseText: {textAlign: 'center', fontSize: 16, fontWeight: 'bold'},
  selectorBlock: {marginTop: 16, gap: 6},
  selectorLabel: {fontWeight: '700', letterSpacing: 0.5},
  dropdownBtn: {width: '100%', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44},
});
