import React, {useRef, useState} from 'react';
import {LogHeader} from '../../database/models/LogHeader';
import {Response} from '../../database/models/response/Response';
import {
  DimensionValue,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {InputForm} from '../input/InputForm';
import {appColors, appStyles} from '../../styles/globalStyles';
import {TouchableButton} from '../button/TouchableButton';
import {useForm} from '../../hooks/useForm';
import SelectDropdown from 'react-native-select-dropdown';
import {Product} from '../../database/models/Product';
import {searchProductsByCodeOrName} from '../../database/repository/ProductRepository';
import Icon from 'react-native-vector-icons/Ionicons';
import {useLogDetails} from '../../hooks/useLogDetails';
import {DetailsItem} from '../DetailsItem';
import {LogDetailRepository} from '../../database/repository/LogDetailRepository';

interface Props {
  initialForm: LogHeader;
  onSubmit: (values: LogHeader) => Promise<Response<LogHeader>> | any;
  isReadonly: boolean;
  navigate?: any;
  selectData?: {id: number; value: string}[];
}

const validateForm = (form: LogHeader) => {
  let errors: any = {};
  if (!form.commets) {
    errors.commets = 'Los comentarios son requeridos';
  }
  if (form.type === 0) {
    errors.type = 'El tipo de entrada es requerido';
  }

  if (form.logDetails.length === 0) {
    errors.details = 'Debes agregar al menos un producto';
  }

  return errors;
};

export const LogForm = ({
  initialForm,
  onSubmit,
  isReadonly,
  navigate,
  selectData = [],
}: Props) => {
  const {
    details,
    addDetail,
    generateRandomId,
    clearDetails,
    removeDetail,
    updateDetail,
  } = useLogDetails();

  const [products, setProducts] = useState<Product[]>([]);
  const noImage = require('../../assets/sin_imagen.png');
  const dropdown = useRef<SelectDropdown>(null);

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
      },
      handleChange,
    );
  };

  return (
    <ScrollView style={[appStyles.flexColumn, styles.container]}>
      <View style={styles.selectContainer}>
        <Text style={appStyles.textDark}>Tipo de entrada</Text>
        <SelectDropdown
          data={selectData}
          defaultValue={selectData?.find(item => item.id === form.type)}
          onSelect={selectedItem => {
            handleChange(selectedItem.id, 'type');
          }}
          rowTextForSelection={item => {
            return item.value;
          }}
          buttonTextAfterSelection={selectedItem => {
            return selectedItem.value;
          }}
          buttonStyle={[styles.input, styles.select]}
          disabled={isReadonly}
        />
        <View>
          <Text style={[appStyles.textDanger, appStyles.textCenter]}>
            {errors.type}
          </Text>
        </View>
      </View>
      <InputForm
        label="Comentarios"
        placeholder="Ingresa una descripción"
        placeholderTextColor={appColors.gray}
        value={form.commets}
        errors={errors.commets}
        onChangeText={text => handleChange(text, 'commets')}
        secureTextEntry={false}
        style={[styles.input, styles.textArea]}
        multiline={true}
        readonly={isReadonly}
      />
      {!isReadonly && (
        <View style={styles.selectContainer}>
          <Text style={appStyles.textDark}>Productos Busqueda</Text>
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
            rowStyle={styles.itemSearchContainer}
            renderCustomizedRowChild={(item: Product) => {
              return (
                <TouchableOpacity
                  style={[
                    appStyles.flexRow,
                    appStyles.alignCenter,
                    appStyles.justifyBetween,
                  ]}
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
                      appStyles.textDark,
                      styles.itemSearchText,
                      styles.fontSize,
                    ]}>
                    {item.name}
                  </Text>
                  <Text style={[appStyles.textDark, styles.fontSize]}>
                    Q{item.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            buttonStyle={[styles.input, styles.select]}
            disabled={isReadonly}
            defaultButtonText="Busca productos para hacer una entrada"
            search
            searchPlaceHolder="Buscar ..."
            onChangeSearchInputText={handleSearch}
            renderDropdownIcon={() => (
              <Icon name={'add-circle'} size={35} color={appColors.success} />
            )}
            renderSearchInputRightIcon={() => (
              <Icon name={'search'} size={35} color={appColors.primary} />
            )}
          />
        </View>
      )}
      <Text
        style={[appStyles.subTitle, appStyles.textCenter, appStyles.textDark]}>
        Lista de Productos
      </Text>
      <ScrollView style={[appStyles.flexColumn, styles.listContainer]}>
        {!isReadonly ? (
          <View>
            {details.map((detail, index) => (
              <DetailsItem
                key={index}
                index={index}
                detail={detail}
                removeDetail={(id: number) => {
                  removeDetail(id, handleChange);
                }}
                updateDetail={updateDetail}
              />
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
        <Text style={[appStyles.textDanger, appStyles.textCenter]}>
          {errors.details}
        </Text>
      </ScrollView>
      <TouchableButton
        onPress={isReadonly ? backToList : handleSubmit}
        title={isReadonly ? 'Regresar' : 'Guardar Datos'}
        icon={isReadonly ? 'arrow-back-circle-sharp' : 'save'}
        iconColor={appColors.white}
        textStyle={[appStyles.subTitle]}
        styles={styles.button}
      />
      {response && (
        <View>
          <Text style={[appStyles.textCenter, appStyles.subTitle]}>
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
  selectContainer: {
    marginTop: 10,
  },
  select: {
    width: '100%',
    marginBottom: 5,
  },
  isReadonlySelect: {
    height: 50,
  },
  listContainer: {
    marginVertical: 10,
    height: 250,
  },
  itemSearchContainer: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    ...appStyles.screen,
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
});
