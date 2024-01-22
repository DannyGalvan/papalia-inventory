import { useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import Picker from 'react-native-document-picker';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  PicturesDirectoryPath,
  copyFile,
  exists,
  mkdir,
  unlink,
} from '@dr.pogodin/react-native-fs';
import uuid from 'react-native-uuid';
import { useStoragePermissions } from './useStoragePermissions';

export const useImages = () => {
  const { checkStoragePermissions } = useStoragePermissions();
  const { dirImages, changeDirImages, isLoading, setIsLoading } =
    useContext(ProductContext);

  const uploadImage = async ({
    updateForm,
    nameImage,
    afterImage,
  }: {
    updateForm: (data: any, field: string) => void;
    nameImage: string;
    afterImage: string;
  }) => {
    try {
      setIsLoading(true);

      if (nameImage === '') {
        Alert.alert(
          'Error',
          'El producto debe contar con un codigo para subir imagen',
        );
        return;
      }

      const granted = await checkStoragePermissions();

      if (!granted) {
        Alert.alert(
          'Error',
          'No se han dado permisos para manipular la información',
        );
        return;
      }

      const res = await Picker.pickSingle({
        type: [Picker.types.images],
      });

      const saveDir = `${PicturesDirectoryPath}/${dirImages}`;

      const exist = await exists(saveDir);

      if (!exist) {
        await mkdir(saveDir, {
          NSURLIsExcludedFromBackupKey: true,
          NSFileProtectionKey: 'NSFileProtectionNone',
        });
      }

      const path = `${saveDir}/${nameImage}_${uuid.v4()}.${res.type.split('/')[1]
        }`;

      const existsPath = await exists(afterImage);

      if (existsPath) {
        await unlink(afterImage);
      }

      await copyFile(res.uri, path);

      const pathSaveDb = `file://${path}`;

      updateForm(pathSaveDb, 'image');

      setIsLoading(false);

      Alert.alert('Exito', 'Imagen subida correctamente');
    } catch (error) {
      if (Picker.isCancel(error)) {
        Alert.alert('Se Cancelo la subida del archivo', error.message);
      } else {
        Alert.alert('Error al subir el archivo', error.message);
      }
      setIsLoading(false);
    }
  };

  return {
    dirImages,
    changeDirImages,
    isLoading,
    uploadImage,
  };
};
