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
import { UnitOfMeasure } from '../../database/models/UnitOfMeasure';
import {
  createUnit,
  deleteUnit,
  getAllUnits,
  toggleUnitActive,
  updateUnit,
} from '../../database/repository/UnitOfMeasureRepository';
import { useTheme } from '../../hooks/useTheme';

type EditingState = {id: number; name: string; abbreviation: string} | null;
type ToastState = {visible: boolean; message: string; type: 'success' | 'error'};
const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const UnitOfMeasureCatalogScreen = () => {
  const {theme} = useTheme();
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAbbrev, setNewAbbrev] = useState('');
  const [toast, setToast] = useState<ToastState>(EMPTY_TOAST);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({visible: true, message, type});
  }, []);

  const load = useCallback(async () => {
    setUnits(await getAllUnits());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (item: UnitOfMeasure) => {
    const result = await toggleUnitActive(item.id);
    if (result.success) {
      setUnits(prev => prev.map(u => u.id === item.id ? {...u, isActive: !u.isActive} : u));
    } else { showToast(result.message, 'error'); }
  };

  const handleSaveEdit = async () => {
    if (!editing) { return; }
    if (!editing.name.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    if (!editing.abbreviation.trim()) { showToast('La abreviación no puede estar vacía', 'error'); return; }
    const result = await updateUnit(editing.id, editing.name, editing.abbreviation);
    if (result.success) {
      setUnits(prev => prev.map(u => u.id === editing.id
        ? {...u, name: editing.name.trim(), abbreviation: editing.abbreviation.trim()}
        : u));
      setEditing(null);
      showToast('Unidad actualizada', 'success');
    } else { showToast(result.message, 'error'); }
  };

  const handleDelete = (item: UnitOfMeasure) => {
    Alert.alert(
      'Eliminar unidad',
      `¿Eliminar "${item.name}"? Los productos con esta unidad quedarán sin unidad asignada.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const result = await deleteUnit(item.id);
            if (result.success) {
              setUnits(prev => prev.filter(u => u.id !== item.id));
              showToast('Unidad eliminada', 'success');
            } else { showToast(result.message, 'error'); }
          },
        },
      ],
    );
  };

  const handleAdd = async () => {
    if (!newName.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    if (!newAbbrev.trim()) { showToast('La abreviación no puede estar vacía', 'error'); return; }
    const result = await createUnit(newName, newAbbrev);
    if (result.success) {
      setUnits(prev => [...prev, result.data!]);
      setNewName(''); setNewAbbrev('');
      setShowAddForm(false);
      showToast('Unidad creada', 'success');
    } else { showToast(result.message, 'error'); }
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]} accessibilityRole="header">
          Unidades de medida
        </Text>

        {units.length === 0 && (
          <Text style={[styles.empty, {color: theme.colors.textSecondary}]}>Sin unidades registradas</Text>
        )}

        {units.map(item => {
          const isEditingThis = editing?.id === item.id;
          return (
            <View key={item.id} style={[styles.row, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border, opacity: item.isActive ? 1 : 0.5}]}>
              {isEditingThis ? (
                <View style={styles.editBlock}>
                  <TextInput
                    style={[styles.editInput, {color: theme.colors.text, borderColor: theme.colors.primary}]}
                    value={editing.name}
                    onChangeText={text => setEditing(prev => prev ? {...prev, name: text} : prev)}
                    placeholder="Nombre"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.editInput, {color: theme.colors.text, borderColor: theme.colors.border}]}
                    value={editing.abbreviation}
                    onChangeText={text => setEditing(prev => prev ? {...prev, abbreviation: text} : prev)}
                    placeholder="Abreviación (ej. kg)"
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={8}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={handleSaveEdit} style={styles.iconBtn} accessibilityLabel="Guardar">
                      <Icon name="checkmark-circle" size={26} color={theme.colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditing(null)} style={styles.iconBtn} accessibilityLabel="Cancelar">
                      <Icon name="close-circle" size={26} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>{item.name}</Text>
                    <View style={[styles.abbrevBadge, {backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary}]}>
                      <Text style={[styles.abbrevText, {color: theme.colors.primary}]}>{item.abbreviation}</Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <Switch
                      value={item.isActive}
                      onValueChange={() => handleToggle(item)}
                      thumbColor={item.isActive ? theme.colors.primary : theme.colors.disabled}
                      trackColor={{false: theme.colors.border, true: theme.colors.primary + '66'}}
                    />
                    <TouchableOpacity onPress={() => setEditing({id: item.id, name: item.name, abbreviation: item.abbreviation})} style={styles.iconBtn}>
                      <Icon name="pencil-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                      <Icon name="trash-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addBtn, {borderColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
          onPress={() => setShowAddForm(v => !v)}>
          <Icon name={showAddForm ? 'chevron-up' : 'add-circle-outline'} size={20} color={theme.colors.primary} />
          <Text style={[styles.addBtnText, {color: theme.colors.primary}]}>{showAddForm ? 'Cancelar' : 'Agregar unidad'}</Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[styles.addForm, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border}]}>
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>Nombre *</Text>
            <TextInput
              style={[styles.addInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              value={newName}
              onChangeText={setNewName}
              placeholder="ej. Kilogramos"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>Abreviación *</Text>
            <TextInput
              style={[styles.addInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              value={newAbbrev}
              onChangeText={setNewAbbrev}
              placeholder="ej. kg"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={8}
            />
            <TouchableOpacity
              style={[styles.saveBtn, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
              onPress={handleAdd}>
              <Icon name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={() => setToast(EMPTY_TOAST)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 16, paddingBottom: 48},
  title: {textAlign: 'center', fontStyle: 'italic', paddingVertical: 10, marginBottom: 8},
  empty: {textAlign: 'center', fontStyle: 'italic', marginBottom: 16},
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth},
  rowInfo: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10},
  rowName: {fontWeight: '600', flex: 1},
  abbrevBadge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1},
  abbrevText: {fontSize: 12, fontWeight: '700'},
  rowActions: {flexDirection: 'row', alignItems: 'center', gap: 4},
  iconBtn: {padding: 4},
  editBlock: {flex: 1, gap: 6},
  editInput: {borderBottomWidth: 1, paddingVertical: 4, fontSize: 14},
  editActions: {flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4},
  addBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed'},
  addBtnText: {fontWeight: '600'},
  addForm: {marginTop: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 6},
  addLabel: {fontWeight: '600'},
  addInput: {borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginBottom: 4},
  saveBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginTop: 4},
  saveBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
