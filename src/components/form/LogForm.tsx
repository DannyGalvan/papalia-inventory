import React, { useEffect, useRef, useState } from 'react';
import {
    DimensionValue,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { checkStockForProduct } from '../../utils/stockValidator';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/Ionicons';
import { LogHeader } from '../../database/models/LogHeader';
import { MovementType } from '../../database/models/MovementType';
import { Product } from '../../database/models/Product';
import { Response } from '../../database/models/response/Response';
import { LogDetailRepository } from '../../database/repository/LogDetailRepository';
import { getMovementTypes } from '../../database/repository/MovementTypeRepository';
import { searchProductsByCodeOrName } from '../../database/repository/ProductRepository';
import { useForm } from '../../hooks/useForm';
import { useLogDetails } from '../../hooks/useLogDetails';
import { useTheme } from '../../hooks/useTheme';
import { validateLogForm } from '../../utils/validateLogForm';
import { DetailsItem } from '../DetailsItem';
import { TouchableButton } from '../button/TouchableButton';
import { InputForm } from '../input/InputForm';

interface Props {
  initialForm: LogHeader;
  onSubmit: (values: LogHeader) => Promise<Response<LogHeader>> | any;
  isReadonly: boolean;
  navigate?: any;
  selectData?: {id: number; value: string}[];
}

const NO_SELECTION: MovementType = {id: 0, name: 'Seleccione una opción', isInput: false, isActive: true};

const validateForm = validateLogForm;

export const LogForm = ({
  initialForm,
  onSubmit,
  isReadonly,
  navigate,
}: Props) => {
  const { theme } = useTheme();

  const {
    details,
    addDetail,
    generateRandomId,
    clearDetails,
    removeDetail,
    updateDetail,
  } = useLogDetails();

  const [products, setProducts] = useState<Product[]>([]);
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([NO_SELECTION]);
  const [stockWarnings, setStockWarnings] = useState<Record<number, string>>({});
  const isOutput = !initialForm.isInput;
  const noImage = require('../../assets/sin_imagen.png');
  const dropdown = useRef<SelectDropdown>(null);

  useEffect(() => {
    getMovementTypes(initialForm.isInput).then(dbTypes => {
      setMovementTypes([NO_SELECTION, ...dbTypes]);
    });
  }, [initialForm.isInput]);

  const handleSearch = async (text: string) => {
    const data = await searchProductsByCodeOrName(text);
    setProducts(data);
  };

  const {form, errors, handleChange, handleSubmit, response} = useForm(
    initialForm,
    validateForm,
    async (inform: LogHeader) => {
      const detailsWithOutId = details.map(detail => {
        delete detail.id;
        return detail;
      });

      const newDetails = detailsWithOutId.map(detail =>
        LogDetailRepository.create(detail),
      );

      inform.logDetails = newDetails;

      const result = await onSubmit(inform);

      clearDetails();

      return result;
    },
  );

  const handleUpdateDetail = (item: Parameters<typeof updateDetail>[0], idx: number) => {
    if (isOutput && item.product) {
      const warning = checkStockForProduct(item.quantity, item.product.stock, item.name);
      setStockWarnings(prev => ({
        ...prev,
        [idx]: warning.hasWarning ? warning.warningMessage : '',
      }));
    }
    updateDetail(item, idx);
  };

  const backToList = () => {
    navigate.goBack();
  };

  const handleSelect = (selectedItem: Product) => {
    addDetail(
      {
        id: generateRandomId(),
        product: selectedItem,
        name: selectedItem.name,
        quantity: 1,
        price: selectedItem.price,
        total: selectedItem.price,
        productCode: selectedItem.code,
        logHeaderId: null,
        logHeader: null as any,
      },
      handleChange,
    );
  };

  return (
    <ScrollView style={[styles.container, styles.mButton]} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
      <View style={styles.selectContainer}>
        <Text style={{ color: theme.colors.text, fontSize: theme.typography.body.fontSize }} accessibilityRole="header">
          Tipo de entrada
        </Text>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Tipo de entrada"
          accessibilityHint="Selecciona el tipo de movimiento de inventario">
          <SelectDropdown
            data={movementTypes}
            defaultValue={movementTypes.find(item => item.id === form.type)}
            onSelect={selectedItem => {
              handleChange(selectedItem.id, 'type');
            }}
            rowTextForSelection={item => item.name}
            buttonTextAfterSelection={selectedItem => selectedItem.name}
            buttonStyle={[styles.input, styles.select, {borderColor: theme.colors.border, backgroundColor: theme.colors.surface}]}
            buttonTextStyle={{color: theme.colors.text}}
            dropdownStyle={{backgroundColor: theme.colors.surface}}
            rowStyle={{backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}}
            rowTextStyle={{color: theme.colors.text}}
            selectedRowStyle={{backgroundColor: theme.colors.primary + '22'}}
            selectedRowTextStyle={{color: theme.colors.primary, fontWeight: '600'}}
            dropdownOverlayColor="transparent"
            disabled={isReadonly}
          />
        </View>
        {!!errors.type && (
          <View>
            <Text
              style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.caption.fontSize }]}
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert">
              {errors.type}
            </Text>
          </View>
        )}
      </View>
      <InputForm
        label="Comentarios"
        placeholder="Ingresa una descripción"
        placeholderTextColor={theme.colors.disabled}
        value={form.comments}
        errors={errors.comments}
        onChangeText={text => handleChange(text, 'comments')}
        secureTextEntry={false}
        colorText={{color: theme.colors.text}}
        style={[styles.input, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
        multiline={true}
        readonly={isReadonly}
      />
      {!isReadonly && (
        <View style={styles.selectContainer}>
          <Text style={{ color: theme.colors.text, fontSize: theme.typography.body.fontSize }} accessibilityRole="header">
            Productos Busqueda
          </Text>
          <View
            accessible
            accessibilityRole="search"
            accessibilityLabel="Buscar productos para la entrada"
            accessibilityHint="Busca y selecciona productos para agregar al movimiento">
            <SelectDropdown
              ref={dropdown}
              data={products}
            onSelect={handleSelect}
            rowTextForSelection={(item: Product) => {
              return item.name;
            }}
            buttonTextAfterSelection={(selectedItem: Product) => {
              return selectedItem.name;
            }}
            rowStyle={[styles.itemSearchContainer, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}]}
            buttonTextStyle={{color: theme.colors.text}}
            dropdownStyle={{backgroundColor: theme.colors.surface}}
            rowTextStyle={{color: theme.colors.text}}
            selectedRowStyle={{backgroundColor: theme.colors.primary + '22'}}
            selectedRowTextStyle={{color: theme.colors.primary, fontWeight: '600'}}
            searchInputStyle={{backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 8}}
            searchInputTxtStyle={{color: theme.colors.text}}
            searchPlaceHolderColor={theme.colors.textSecondary}
            dropdownOverlayColor="transparent"
            renderCustomizedRowChild={(item: Product) => {
              return (
                <TouchableOpacity
                  style={[styles.rowChild]}
                  onPress={() => {
                    handleSelect(item);
                    dropdown.current.closeDropdown();
                  }}>
                  <Image
                    style={styles.image}
                    source={
                      item.image
                        ? {
                            uri: item.image,
                          }
                        : noImage
                    }
                  />
                  <Text
                    style={[
                      styles.itemSearchText,
                      styles.fontSize,
                      { color: theme.colors.text },
                    ]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.fontSize, { color: theme.colors.text }]}>
                    Q{item.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            buttonStyle={[styles.input, styles.select, {borderColor: theme.colors.border, backgroundColor: theme.colors.surface}]}
            disabled={isReadonly}
            defaultButtonText="Busca productos para hacer una entrada"
            search
            searchPlaceHolder="Buscar ..."
            onChangeSearchInputText={handleSearch}
            renderDropdownIcon={() => (
              <Icon name={'add-circle'} size={35} color={theme.colors.success} />
            )}
            renderSearchInputRightIcon={() => (
              <Icon name={'search'} size={35} color={theme.colors.primary} />
            )}
          />
          </View>
        </View>
      )}
      <Text
        style={[styles.subTitle, { color: theme.colors.text, fontSize: theme.typography.h2.fontSize }]}
        accessibilityRole="header">
        Lista de Productos
      </Text>
      <ScrollView style={[styles.listContainer]}>
        {!isReadonly ? (
          <View>
            {details.map((detail, index) => (
              <View key={index}>
                <DetailsItem
                  index={index}
                  detail={detail}
                  removeDetail={(id: number) => {
                    removeDetail(id, handleChange);
                  }}
                  updateDetail={handleUpdateDetail}
                />
                {isOutput && !!stockWarnings[index] && (
                  <Text
                    style={[
                      styles.stockWarning,
                      {
                        color: theme.colors.error,
                        fontSize: theme.typography.caption.fontSize,
                      },
                    ]}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite">
                    {stockWarnings[index]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View>
            {initialForm?.logDetails.map((detail, index) => (
              <DetailsItem
                key={index}
                index={index}
                detail={detail}
                removeDetail={(id: number) => {
                  removeDetail(id, handleChange);
                }}
                updateDetail={updateDetail}
                readonly={isReadonly}
              />
            ))}
          </View>
        )}
        {!!errors.details && (
          <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.caption.fontSize }]}>
            {errors.details}
          </Text>
        )}
      </ScrollView>
      <TouchableButton
        onPress={isReadonly ? backToList : handleSubmit}
        title={isReadonly ? 'Regresar' : 'Guardar Datos'}
        icon={isReadonly ? 'arrow-back-circle-sharp' : 'save'}
        iconColor="#FFFFFF"
        textStyle={[styles.buttonText]}
        styles={[styles.button, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg }]}
        accessibilityLabel={isReadonly ? 'Regresar a la lista' : 'Guardar datos del movimiento'}
        accessibilityHint={isReadonly ? 'Regresa a la lista anterior' : 'Guarda el movimiento de inventario'}
      />
      {response && (
        <View>
          <Text
            style={[
              styles.responseText,
              {
                color: response.success ? theme.colors.success : theme.colors.error,
                fontSize: theme.typography.body.fontSize,
                fontWeight: theme.typography.h2.fontWeight,
              },
            ]}>
            {response.message}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'column',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mButton: {
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginTop: 10,
  },
  selectContainer: {
    marginTop: 10,
  },
  select: {
    width: '100%',
    marginBottom: 5,
  },
  listContainer: {
    marginVertical: 10,
    height: 200,
    flexDirection: 'column',
  },
  itemSearchContainer: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  itemSearchText: {
    width: '60%',
  },
  fontSize: {
    fontSize: 12,
  },
  image: {
    width: '20%' as DimensionValue,
    height: 45,
    resizeMode: 'contain',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 4,
  },
  stockWarning: {
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  subTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  responseText: {
    textAlign: 'center',
  },
  rowChild: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
