import {StyleSheet} from 'react-native';

export const appColors = {
  black: '#000',
  white: '#fff',
  gray: '#ccc',
  primary: '#0d47a1',
  danger: '#d32f2f',
  opacity: 'rgba(255,255,255,0.5)',
  success: '#4caf50',
  warning: '#ffc107',
};

export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 14,
  },
  textCenter: {
    textAlign: 'center',
  },
  textVerticalCenter: {
    textAlignVertical: 'center',
  },
  textDark: {
    color: appColors.black,
  },
  textDanger: {
    color: appColors.danger,
  },
  textWhite: {
    color: appColors.white,
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexColumn: {
    flexDirection: 'column',
  },
  bgGray: {
    backgroundColor: appColors.gray,
  },
  bgPrimary: {
    backgroundColor: appColors.primary,
  },
  bgWhite: {
    backgroundColor: appColors.white,
  },
  bgDanger: {
    backgroundColor: appColors.danger,
  },
  inputDark: {
    height: 40,
    borderBottomWidth: 2,
    borderColor: appColors.white,
    color: appColors.white,
  },
  inputLight: {
    height: 40,
    borderBottomWidth: 2,
    borderColor: appColors.black,
    color: appColors.black,
  },
  button: {
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
});
