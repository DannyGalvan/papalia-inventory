import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Toast } from '../../components/feedback/Toast';
import { MovementType } from '../../database/models/MovementType';
import {
  createMovementType,
  deleteMovementType,
  getAllMovementTypes,
  toggleMovementTypeActive,
  updateMovementType,
} from '../../database/repository/MovementTypeRepository';
import { useTheme } from '../../hooks/useTheme';

type EditingState = {id: number; name: string} | null;

type ToastState = {visible: boolean; message: string; type: 'success' | 'error'};

const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const MovementTypeCatalogScreen = () => {
  const {theme} = useTheme();
  const [types, setTypes] = useState<MovementType[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const [newName, setNewName] = useState('');
  const [newIsInput, setNewIsInput] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<ToastState>(EMPTY_TOAST);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({visible: true, message, type});
  }, []);

  const load = useCallback(async () => {
    setTypes(await getAllMovementTypes());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (item: MovementType) => {
    const result = await toggleMovementTypeActive(item.id);
    if (result.success) {
      setTypes(prev => prev.map(t => t.id === item.id ? {...t, isActive: !t.isActive} : t));
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleStartEdit = (item: MovementType) => {
    setEditing({id: item.id, name: item.name});
  };

  const handleSaveEdit = async () => {
    if (!editing) {return;}
    if (!editing.name.trim()) {
      showToast('El nombre no puede estar vacío', 'error');
      return;
    }
    const result = await updateMovementType(editing.id, editing.name);
    if (result.success) {
      setTypes(prev => prev.map(t => t.id === editing.id ? {...t, name: editing.name.trim()} : t));
      setEditing(null);
      showToast('Tipo actualizado', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleDelete = (item: MovementType) => {
    Alert.alert(
      'Eliminar tipo',
      `¿Eliminar "${item.name}"? Los registros existentes con este tipo no se verán afectados.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMovementType(item.id);
            if (result.success) {
              setTypes(prev => prev.filter(t => t.id !== item.id));
              showToast('Tipo eliminado', 'success');
            } else {
              showToast(result.message, 'error');
            }
          },
        },
      ],
    );
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      showToast('El nombre no puede estar vacío', 'error');
      return;
    }
    const result = await createMovementType(newName, newIsInput);
    if (result.success) {
      setTypes(prev => [...prev, result.data!]);
      setNewName('');
      setShowAddForm(false);
      showToast('Tipo creado', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const inputTypes = types.filter(t => t.isInput);
  const outputTypes = types.filter(t => !t.isInput);

  const renderItem = (item: MovementType) => {
    const isEditingThis = editing?.id === item.id;
    return (
      <View
        key={item.id}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderColor: theme.colors.border,
            opacity: item.isActive ? 1 : 0.5,
          },
        ]}>
        {isEditingThis ? (
          <TextInput
            style={[styles.editInput, {color: theme.colors.text, borderColor: theme.colors.primary}]}
            value={editing.name}
            onChangeText={text => setEditing(prev => prev ? {...prev, name: text} : prev)}
            autoFocus
            onSubmitEditing={handleSaveEdit}
            accessibilityLabel="Editar nombre del tipo"
          />
        ) : (
          <Text style={[styles.rowName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}
            numberOfLines={1}>
            {item.name}
          </Text>
        )}

        <View style={styles.rowActions}>
          {isEditingThis ? (
            <>
              <TouchableOpacity onPress={handleSaveEdit} style={styles.iconBtn}
                accessibilityLabel="Guardar cambio">
                <Icon name="checkmark-circle" size={22} color={theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(null)} style={styles.iconBtn}
                accessibilityLabel="Cancelar edición">
                <Icon name="close-circle" size={22} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggleActive(item)}
                thumbColor={item.isActive ? theme.colors.primary : theme.colors.disabled}
                trackColor={{false: theme.colors.border, true: theme.colors.primary + '66'}}
                accessibilityLabel={`${item.isActive ? 'Desactivar' : 'Activar'} ${item.name}`}
              />
              <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.iconBtn}
                accessibilityLabel={`Editar ${item.name}`}>
                <Icon name="pencil-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}
                accessibilityLabel={`Eliminar ${item.name}`}>
                <Icon name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const sectionHeaderStyle = [
    styles.sectionHeader,
    {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize},
  ];

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text
          style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]}
          accessibilityRole="header">
          Tipos de movimiento
        </Text>

        {/* ── Salidas ── */}
        <Text style={sectionHeaderStyle}>SALIDAS</Text>
        {outputTypes.length === 0 ? (
          <Text style={[styles.empty, {color: theme.colors.textSecondary}]}>Sin tipos de salida</Text>
        ) : (
          outputTypes.map(renderItem)
        )}

        {/* ── Entradas ── */}
        <Text style={[sectionHeaderStyle, styles.sectionSep]}>ENTRADAS</Text>
        {inputTypes.length === 0 ? (
          <Text style={[styles.empty, {color: theme.colors.textSecondary}]}>Sin tipos de entrada</Text>
        ) : (
          inputTypes.map(renderItem)
        )}

        {/* ── Agregar nuevo ── */}
        <TouchableOpacity
          style={[styles.addBtn, {borderColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
          onPress={() => setShowAddForm(v => !v)}
          accessibilityRole="button"
          accessibilityLabel="Agregar tipo de movimiento">
          <Icon name={showAddForm ? 'chevron-up' : 'add-circle-outline'} size={20} color={theme.colors.primary} />
          <Text style={[styles.addBtnText, {color: theme.colors.primary, fontSize: theme.typography.body.fontSize}]}>
            {showAddForm ? 'Cancelar' : 'Agregar tipo'}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[styles.addForm, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border}]}>
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>
              Nombre
            </Text>
            <TextInput
              style={[styles.addInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre del tipo"
              placeholderTextColor={theme.colors.textSecondary}
              accessibilityLabel="Nombre del nuevo tipo"
            />

            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>
              Tipo de movimiento
            </Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  {borderRadius: theme.borderRadius.sm, borderColor: theme.colors.border},
                  !newIsInput && {backgroundColor: theme.colors.primary},
                ]}
                onPress={() => setNewIsInput(false)}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar salida">
                <Text style={[styles.typeBtnText, {color: !newIsInput ? '#fff' : theme.colors.text}]}>
                  Salida
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  {borderRadius: theme.borderRadius.sm, borderColor: theme.colors.border},
                  newIsInput && {backgroundColor: theme.colors.primary},
                ]}
                onPress={() => setNewIsInput(true)}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar entrada">
                <Text style={[styles.typeBtnText, {color: newIsInput ? '#fff' : theme.colors.text}]}>
                  Entrada
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveAddBtn, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="Guardar nuevo tipo">
              <Icon name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveAddBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={() => setToast(EMPTY_TOAST)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 16, paddingBottom: 48},
  title: {textAlign: 'center', fontStyle: 'italic', paddingVertical: 10, marginBottom: 8},
  sectionHeader: {fontWeight: '600', letterSpacing: 1, marginTop: 16, marginBottom: 8},
  sectionSep: {marginTop: 24},
  empty: {textAlign: 'center', fontStyle: 'italic', marginBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowName: {flex: 1, marginRight: 8},
  rowActions: {flexDirection: 'row', alignItems: 'center', gap: 4},
  iconBtn: {padding: 4},
  editInput: {
    flex: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginRight: 8,
    fontSize: 15,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: {fontWeight: '600'},
  addForm: {
    marginTop: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  addLabel: {fontWeight: '600', marginBottom: 2},
  addInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    marginBottom: 4,
  },
  typeToggle: {flexDirection: 'row', gap: 8, marginBottom: 4},
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeBtnText: {fontWeight: '600', fontSize: 14},
  saveAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  saveAddBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
