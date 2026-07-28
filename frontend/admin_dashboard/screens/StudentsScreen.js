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

const STUDENTS = [
  { id: 's1', name: 'Aarav Sharma', className: 'Grade 10 - B', roll: '24', status: 'Active' },
  { id: 's2', name: 'Meera Krishnan', className: 'Grade 9 - A', roll: '07', status: 'Active' },
  { id: 's3', name: 'Rohan Verma', className: 'Grade 10 - B', roll: '11', status: 'Blocked' },
  { id: 's4', name: 'Sneha Pillai', className: 'Grade 11 - C', roll: '18', status: 'Active' },
  { id: 's5', name: 'Karthik Jayan', className: 'Grade 9 - A', roll: '29', status: 'Active' },
  { id: 's6', name: 'Divya Menon', className: 'Grade 11 - C', roll: '05', status: 'Inactive' },
];

const getInitials = (name) =>
  name.split(' ').map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();

const getStatusVariant = (status) => {
  if (status === 'Active') return 'success';
  if (status === 'Blocked') return 'danger';
  return 'neutral';
};

const StudentsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const filteredStudents = useMemo(() => {
    return STUDENTS.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeOnly ? student.status === 'Active' : true;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeOnly]);

  const handleEdit = (studentId) => {
    // Intentionally left as a no-op: UI only, ready for backend integration.
  };

  const handleDelete = (studentId) => {
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
      <Header title="Students" subtitle="Manage student records" />

      <View style={styles.section}>
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search students"
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
          title="Import Student Excel (.xlsx)"
          subtitle="Bulk add students from a spreadsheet"
          onPress={handleImportPress}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle
          title={`All Students (${filteredStudents.length})`}
          subtitle="Tap edit or delete to manage a record"
        />
        <DashboardCard noPadding>
          {filteredStudents.length === 0 ? (
            <Text style={styles.emptyText}>No students match your search.</Text>
          ) : (
            filteredStudents.map((student, index) => (
              <TableRow
                key={student.id}
                avatarText={getInitials(student.name)}
                title={student.name}
                subtitle={`${student.className}  ·  Roll ${student.roll}`}
                statusLabel={student.status}
                statusVariant={getStatusVariant(student.status)}
                onEdit={() => handleEdit(student.id)}
                onDelete={() => handleDelete(student.id)}
                isLast={index === filteredStudents.length - 1}
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

export default StudentsScreen;
