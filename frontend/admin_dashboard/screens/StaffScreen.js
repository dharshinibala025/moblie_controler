import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FilterButton from '../components/FilterButton';
import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import TableRow from '../components/TableRow';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

// ---------------------------------------------------------------------------
// Dummy data (no backend / no API calls)
// ---------------------------------------------------------------------------

const STAFF = [
  { id: 't1', name: 'Priya Nair', department: 'Mathematics', staffId: '214', status: 'Active' },
  { id: 't2', name: 'Anil Kumar', department: 'Physics', staffId: '118', status: 'Active' },
  { id: 't3', name: 'Divya Francis', department: 'Administration', staffId: '076', status: 'On leave' },
  { id: 't4', name: 'Ramesh Subin', department: 'Sports', staffId: '152', status: 'Active' },
  { id: 't5', name: 'Lakshmi Iyer', department: 'Chemistry', staffId: '093', status: 'Active' },
];

const getInitials = (name) =>
  name.split(' ').map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();

const getStatusVariant = (status) => {
  if (status === 'Active') return 'success';
  if (status === 'On leave') return 'warning';
  return 'neutral';
};

const StaffScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const filteredStaff = useMemo(() => {
    return STAFF.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeOnly ? member.status === 'Active' : true;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeOnly]);

  const handleEdit = (staffId) => {
    // Intentionally left as a no-op: UI only, ready for backend integration.
  };

  const handleDelete = (staffId) => {
    // Intentionally left as a no-op: UI only, ready for backend integration.
  };

  const handleImportPress = () => {
    // Intentionally left as a no-op: UI only, ready for file-picker/backend integration.
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Staff" subtitle="Manage staff records" />

      <View style={styles.section}>
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search staff"
          />
          <View style={{ width: spacing.sm }} />
          <FilterButton
            label="Active"
            active={activeOnly}
            onPress={() => setActiveOnly((prev) => !prev)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ImportExcelCard
          title="Import Staff Excel (.xlsx)"
          subtitle="Bulk add staff from a spreadsheet"
          onPress={handleImportPress}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          title={`All Staff (${filteredStaff.length})`}
          subtitle="Tap edit or delete to manage a record"
        />
        <DashboardCard noPadding>
          {filteredStaff.length === 0 ? (
            <Text style={styles.emptyText}>No staff match your search.</Text>
          ) : (
            filteredStaff.map((member, index) => (
              <TableRow
                key={member.id}
                avatarText={getInitials(member.name)}
                avatarColor={colors.skyBlue}
                title={member.name}
                subtitle={`${member.department}  ·  Staff ID ${member.staffId}`}
                statusLabel={member.status}
                statusVariant={getStatusVariant(member.status)}
                onEdit={() => handleEdit(member.id)}
                onDelete={() => handleDelete(member.id)}
                isLast={index === filteredStaff.length - 1}
              />
            ))
          )}
        </DashboardCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default StaffScreen;
