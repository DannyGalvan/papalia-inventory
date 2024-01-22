import { Alert, PermissionsAndroid, Platform } from 'react-native';

export const useStoragePermissions = () => {

    const checkStoragePermissions = async () => {

        let permissions;

        if (parseInt(Platform.Version.toString()) >= 33) {

            permissions = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (permissions !== 'granted') {
                Alert.alert(
                    'Error',
                    'No se otorgaron permisos para mostrar notificaciones',
                );
                return false;
            }

            permissions = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            );

            if (permissions !== 'granted') {
                Alert.alert(
                    'Error',
                    'No se otorgaron permisos para acceder al almacenamiento',
                );
                return false;
            }

            return true;
        } else {
            permissions = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );

            if (permissions !== 'granted') {
                Alert.alert(
                    'Error',
                    'No se otorgaron permisos para acceder al almacenamiento',
                );
                return false;
            }

            permissions = await PermissionsAndroid.request(
                'android.permission.WRITE_EXTERNAL_STORAGE',
            );

            if (permissions !== 'granted') {
                Alert.alert(
                    'Error',
                    'No se otorgaron permisos para acceder al almacenamiento',
                );

                return false;
            }

            return true;
        }
    }

    return {
        checkStoragePermissions
    }
}
