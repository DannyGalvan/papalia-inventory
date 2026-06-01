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
import { Category } from '../../database/models/Category';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  toggleCategoryActive,
  updateCategory,
} from '../../database/repository/CategoryRepository';
import { useTheme } from '../../hooks/useTheme';

const PALETTE = [
  '#6B7280', '#EF4444', '#F97316', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6',
];

type EditingState = {id: number; name: string; description: string; color: string} | null;
type ToastState = {visible: boolean; message: string; type: 'success' | 'error'};
const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const CategoryCatalogScreen = () => {
  const {theme} = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [toast, setToast] = useState<ToastState>(EMPTY_TOAST);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({visible: true, message, type});
  }, []);

  const load = useCallback(async () => {
    setCategories(await getAllCategories());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (item: Category) => {
    const result = await toggleCategoryActive(item.id);
    if (result.success) {
      setCategories(prev => prev.map(c => c.id === item.id ? {...c, isActive: !c.isActive} : c));
    } else { showToast(result.message, 'error'); }
  };

  const handleSaveEdit = async () => {
    if (!editing) { return; }
    if (!editing.name.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    const result = await updateCategory(editing.id, editing.name, editing.description, editing.color);
    if (result.success) {
      setCategories(prev => prev.map(c => c.id === editing.id
        ? {...c, name: editing.name.trim(), description: editing.description.trim(), color: editing.color}
        : c));
      setEditing(null);
      showToast('Categoría actualizada', 'success');
    } else { showToast(result.message, 'error'); }
  };

  const handleDelete = (item: Category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${item.name}"? Los productos con esta categoría quedarán sin categoría.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(item.id);
            if (result.success) {
              setCategories(prev => prev.filter(c => c.id !== item.id));
              showToast('Categoría eliminada', 'success');
            } else { showToast(result.message, 'error'); }
          },
        },
      ],
    );
  };

  const handleAdd = async () => {
    if (!newName.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    const result = await createCategory(newName, newDesc, newColor);
    if (result.success) {
      setCategories(prev => [...prev, result.data!]);
      setNewName(''); setNewDesc(''); setNewColor(PALETTE[0]);
      setShowAddForm(false);
      showToast('Categoría creada', 'success');
    } else { showToast(result.message, 'error'); }
  };

  const ColorPicker = ({selected, onSelect}: {selected: string; onSelect: (c: string) => void}) => (
    <View style={styles.palette}>
      {PALETTE.map(color => (
        <TouchableOpacity
          key={color}
          style={[styles.swatch, {backgroundColor: color, borderWidth: selected === color ? 3 : 0, borderColor: theme.colors.text}]}
          onPress={() => onSelect(color)}
          accessibilityLabel={`Color ${color}`}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]} accessibilityRole="header">
          Categorías de productos
        </Text>

        {categories.length === 0 && (
          <Text style={[styles.empty, {color: theme.colors.textSecondary}]}>Sin categorías registradas</Text>
        )}

        {categories.map(item => {
          const isEditingThis = editing?.id === item.id;
          return (
            <View key={item.id} style={[styles.row, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border, opacity: item.isActive ? 1 : 0.5}]}>
              <View style={[styles.colorDot, {backgroundColor: item.color}]} />
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
                    value={editing.description}
                    onChangeText={text => setEditing(prev => prev ? {...prev, description: text} : prev)}
                    placeholder="Descripción (opcional)"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <ColorPicker selected={editing.color} onSelect={color => setEditing(prev => prev ? {...prev, color} : prev)} />
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
                    <Text style={[styles.rowName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]} numberOfLines={1}>{item.name}</Text>
                    {!!item.description && (
                      <Text style={[styles.rowDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]} numberOfLines={1}>{item.description}</Text>
                    )}
                  </View>
                  <View style={styles.rowActions}>
                    <Switch
                      value={item.isActive}
                      onValueChange={() => handleToggle(item)}
                      thumbColor={item.isActive ? theme.colors.primary : theme.colors.disabled}
                      trackColor={{false: theme.colors.border, true: theme.colors.primary + '66'}}
                    />
                    <TouchableOpacity onPress={() => setEditing({id: item.id, name: item.name, description: item.description, color: item.color})} style={styles.iconBtn}>
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
          <Text style={[styles.addBtnText, {color: theme.colors.primary}]}>{showAddForm ? 'Cancelar' : 'Agregar categoría'}</Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[styles.addForm, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border}]}>
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>Nombre *</Text>
            <TextInput
              style={[styles.addInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre de la categoría"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>Descripción</Text>
            <TextInput
              style={[styles.addInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Descripción opcional"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.addLabel, {color: theme.colors.text, fontSize: theme.typography.caption.fontSize}]}>Color</Text>
            <ColorPicker selected={newColor} onSelect={setNewColor} />
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
  colorDot: {width: 14, height: 14, borderRadius: 7, marginRight: 10, flexShrink: 0},
  rowInfo: {flex: 1, marginRight: 4},
  rowName: {fontWeight: '600'},
  rowDesc: {marginTop: 2},
  rowActions: {flexDirection: 'row', alignItems: 'center', gap: 4},
  iconBtn: {padding: 4},
  editBlock: {flex: 1, gap: 6},
  editInput: {borderBottomWidth: 1, paddingVertical: 4, fontSize: 14},
  editActions: {flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4},
  palette: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4},
  swatch: {width: 28, height: 28, borderRadius: 14},
  addBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed'},
  addBtnText: {fontWeight: '600'},
  addForm: {marginTop: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 6},
  addLabel: {fontWeight: '600'},
  addInput: {borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginBottom: 4},
  saveBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginTop: 4},
  saveBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
