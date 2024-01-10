import React, {ReactNode, createContext, useState} from 'react';
import {Alert} from 'react-native';
import {useEffect} from 'react';
import {
  ConfigurationRepository,
  createConfiguration,
  getConfigurationByKey,
  updateConfiguration,
} from '../database/repository/ConfigurationRepository';
import {KEY_DIR_IMAGES} from '../config/constants';

export interface IProductContext {
  dirImages: string;
  changeDirImages: (dir: string) => Promise<void>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProductContext = createContext({} as IProductContext);

export const ProductProvider = ({children}: {children: ReactNode}) => {
  const [dirImages, setDirImages] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const dir = await getConfigurationByKey(KEY_DIR_IMAGES);
      if (dir) {
        setDirImages(dir.value);
      } else {
        const newEntity = ConfigurationRepository.create({
          key: KEY_DIR_IMAGES,
          value: 'imagenes_productos_papalia',
        });

        const updatedConfig = await createConfiguration(newEntity);

        if (!updatedConfig.success) {
          Alert.alert('Error', updatedConfig.message);
        }
        setDirImages(updatedConfig.data.value);
      }
      setIsLoading(false);
    })();
  }, []);

  const changeDirImages = async (dir: string) => {
    try {
      setIsLoading(true);
      if (!dir) {
        Alert.alert('Error', 'El nombre de la carpeta no puede estar vacio');
        setIsLoading(false);
        return;
      } else if (dir.length < 5) {
        Alert.alert(
          'Error',
          'El nombre de la carpeta debe tener al menos 5 caracteres',
        );
        setIsLoading(false);
        return;
      }

      const newEntity = ConfigurationRepository.create({
        key: KEY_DIR_IMAGES,
        value: dir,
      });

      const updatedConfig = await updateConfiguration(newEntity);

      if (!updatedConfig.success) {
        Alert.alert('Error', updatedConfig.message);
      }

      setDirImages(updatedConfig.data.value);
      Alert.alert('Exito', 'Nombre de la carpeta actualizado correctamente');
      setIsLoading(false);
    } catch (error) {
      Alert.alert('Error', error.message);
      setIsLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        dirImages,
        changeDirImages,
        isLoading,
        setIsLoading,
      }}>
      {children}
    </ProductContext.Provider>
  );
};
