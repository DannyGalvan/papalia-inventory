import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Supplier } from '../../database/models/Supplier';
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  toggleSupplierActive,
  updateSupplier,
} from '../../database/repository/SupplierRepository';
import { useTheme } from '../../hooks/useTheme';

type FormState = {name: string; phone: string; email: string; address: string; notes: string};
const EMPTY_FORM: FormState = {name: '', phone: '', email: '', address: '', notes: ''};
type EditingState = {id: number} & FormState | null;
type ToastState = {visible: boolean; message: string; type: 'success' | 'error'};
const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const SupplierCatalogScreen = () => {
  const {theme} = useTheme();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editing, setEditing] = useState<EditingState>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(EMPTY_TOAST);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({visible: true, message, type});
  }, []);

  const load = useCallback(async () => {
    setSuppliers(await getAllSuppliers());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (item: Supplier) => {
    const result = await toggleSupplierActive(item.id);
    if (result.success) {
      setSuppliers(prev => prev.map(s => s.id === item.id ? {...s, isActive: !s.isActive} : s));
    } else { showToast(result.message, 'error'); }
  };

  const handleStartEdit = (item: Supplier) => {
    setEditing({id: item.id, name: item.name, phone: item.phone, email: item.email, address: item.address, notes: item.notes});
    setExpandedId(item.id);
  };

  const handleSaveEdit = async () => {
    if (!editing) { return; }
    if (!editing.name.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    const result = await updateSupplier(editing.id, {
      name: editing.name.trim(),
      phone: editing.phone.trim(),
      email: editing.email.trim(),
      address: editing.address.trim(),
      notes: editing.notes.trim(),
    });
    if (result.success) {
      setSuppliers(prev => prev.map(s => s.id === editing.id
        ? {...s, ...result.data}
        : s));
      setEditing(null);
      showToast('Proveedor actualizado', 'success');
    } else { showToast(result.message, 'error'); }
  };

  const handleDelete = (item: Supplier) => {
    Alert.alert(
      'Eliminar proveedor',
      `¿Eliminar "${item.name}"? Los productos asociados a este proveedor quedarán sin proveedor.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const result = await deleteSupplier(item.id);
            if (result.success) {
              setSuppliers(prev => prev.filter(s => s.id !== item.id));
              showToast('Proveedor eliminado', 'success');
            } else { showToast(result.message, 'error'); }
          },
        },
      ],
    );
  };

  const handleAdd = async () => {
    if (!newForm.name.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    const result = await createSupplier({
      name: newForm.name.trim(),
      phone: newForm.phone.trim(),
      email: newForm.email.trim(),
      address: newForm.address.trim(),
      notes: newForm.notes.trim(),
      isActive: true,
    });
    if (result.success) {
      setSuppliers(prev => [...prev, result.data!]);
      setNewForm(EMPTY_FORM);
      setShowAddForm(false);
      showToast('Proveedor creado', 'success');
    } else { showToast(result.message, 'error'); }
  };

  const inputStyle = (focused = false) => [
    styles.fieldInput,
    {
      color: theme.colors.text,
      borderColor: focused ? theme.colors.primary : theme.colors.border,
      backgroundColor: theme.colors.background,
    },
  ];

  const SupplierField = ({label, value, onChangeText, placeholder, keyboard = 'default'}: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; keyboard?: any;
  }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>{label}</Text>
      <TextInput
        style={inputStyle()}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboard}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]} accessibilityRole="header">
          Proveedores
        </Text>

        {suppliers.length === 0 && (
          <Text style={[styles.empty, {color: theme.colors.textSecondary}]}>Sin proveedores registrados</Text>
        )}

        {suppliers.map(item => {
          const isEditingThis = editing?.id === item.id;
          const isExpanded = expandedId === item.id && !isEditingThis;
          return (
            <View key={item.id} style={[styles.card, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border, opacity: item.isActive ? 1 : 0.5}]}>
              {/* Header row */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <Icon name="business-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.cardName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item)}
                  thumbColor={item.isActive ? theme.colors.primary : theme.colors.disabled}
                  trackColor={{false: theme.colors.border, true: theme.colors.primary + '66'}}
                />
                <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.iconBtn}>
                  <Icon name="pencil-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                  <Icon name="trash-outline" size={18} color={theme.colors.error} />
                </TouchableOpacity>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {/* Expanded info */}
              {isExpanded && (
                <View style={[styles.cardDetail, {borderTopColor: theme.colors.border}]}>
                  {!!item.phone && <Text style={[styles.detailLine, {color: theme.colors.textSecondary}]}>📞 {item.phone}</Text>}
                  {!!item.email && <Text style={[styles.detailLine, {color: theme.colors.textSecondary}]}>✉️ {item.email}</Text>}
                  {!!item.address && <Text style={[styles.detailLine, {color: theme.colors.textSecondary}]}>📍 {item.address}</Text>}
                  {!!item.notes && <Text style={[styles.detailLine, {color: theme.colors.textSecondary}]}>📝 {item.notes}</Text>}
                  {!item.phone && !item.email && !item.address && !item.notes && (
                    <Text style={[styles.detailLine, {color: theme.colors.textSecondary, fontStyle: 'italic'}]}>Sin información adicional</Text>
                  )}
                </View>
              )}

              {/* Inline edit form */}
              {isEditingThis && (
                <View style={[styles.cardDetail, {borderTopColor: theme.colors.border}]}>
                  <SupplierField label="Nombre *" value={editing.name} onChangeText={t => setEditing(prev => prev ? {...prev, name: t} : prev)} placeholder="Nombre del proveedor" />
                  <SupplierField label="Teléfono" value={editing.phone} onChangeText={t => setEditing(prev => prev ? {...prev, phone: t} : prev)} placeholder="+502 0000-0000" keyboard="phone-pad" />
                  <SupplierField label="Email" value={editing.email} onChangeText={t => setEditing(prev => prev ? {...prev, email: t} : prev)} placeholder="correo@ejemplo.com" keyboard="email-address" />
                  <SupplierField label="Dirección" value={editing.address} onChangeText={t => setEditing(prev => prev ? {...prev, address: t} : prev)} placeholder="Ciudad, país" />
                  <SupplierField label="Notas" value={editing.notes} onChangeText={t => setEditing(prev => prev ? {...prev, notes: t} : prev)} placeholder="Información adicional" />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.colors.success, borderRadius: theme.borderRadius.sm}]} onPress={handleSaveEdit}>
                      <Icon name="checkmark" size={16} color="#fff" />
                      <Text style={styles.editBtnText}>Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.colors.error, borderRadius: theme.borderRadius.sm}]} onPress={() => setEditing(null)}>
                      <Icon name="close" size={16} color="#fff" />
                      <Text style={styles.editBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addBtn, {borderColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
          onPress={() => setShowAddForm(v => !v)}>
          <Icon name={showAddForm ? 'chevron-up' : 'add-circle-outline'} size={20} color={theme.colors.primary} />
          <Text style={[styles.addBtnText, {color: theme.colors.primary}]}>{showAddForm ? 'Cancelar' : 'Agregar proveedor'}</Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={[styles.addForm, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border}]}>
            <SupplierField label="Nombre *" value={newForm.name} onChangeText={t => setNewForm(p => ({...p, name: t}))} placeholder="Nombre del proveedor" />
            <SupplierField label="Teléfono" value={newForm.phone} onChangeText={t => setNewForm(p => ({...p, phone: t}))} placeholder="+502 0000-0000" keyboard="phone-pad" />
            <SupplierField label="Email" value={newForm.email} onChangeText={t => setNewForm(p => ({...p, email: t}))} placeholder="correo@ejemplo.com" keyboard="email-address" />
            <SupplierField label="Dirección" value={newForm.address} onChangeText={t => setNewForm(p => ({...p, address: t}))} placeholder="Ciudad, país" />
            <SupplierField label="Notas" value={newForm.notes} onChangeText={t => setNewForm(p => ({...p, notes: t}))} placeholder="Información adicional" />
            <TouchableOpacity
              style={[styles.saveBtn, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
              onPress={handleAdd}>
              <Icon name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar proveedor</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={() => setToast(EMPTY_TOAST)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 16, paddingBottom: 48},
  title: {textAlign: 'center', fontStyle: 'italic', paddingVertical: 10, marginBottom: 8},
  empty: {textAlign: 'center', fontStyle: 'italic', marginBottom: 16},
  card: {marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden'},
  cardHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8},
  cardName: {flex: 1, fontWeight: '600'},
  iconBtn: {padding: 4},
  cardDetail: {borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 10, gap: 4},
  detailLine: {fontSize: 13, lineHeight: 20},
  field: {gap: 4, marginBottom: 4},
  fieldLabel: {fontWeight: '600'},
  fieldInput: {borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14},
  editActions: {flexDirection: 'row', gap: 8, marginTop: 8},
  editBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8},
  editBtnText: {color: '#fff', fontWeight: '600', fontSize: 13},
  addBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed'},
  addBtnText: {fontWeight: '600'},
  addForm: {marginTop: 12, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 4},
  saveBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginTop: 8},
  saveBtnText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
