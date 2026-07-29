import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import PersonRecordCard from '../components/PersonRecordCard';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';
import { YEARS, getSectionOptions } from '../config/sectionsConfig';

// ---------------------------------------------------------------------------
// Dummy data (no backend / no API calls). Year/Section here represent the
// class a staff member is currently assigned to (e.g. class teacher duty).
// ---------------------------------------------------------------------------

const INITIAL_STAFF = [
  {
    id: 't1',
    name: 'Priya Nair',
    staffId: 'STF214',
    department: 'Mathematics',
    year: '1st Year',
    section: 'A',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 't2',
    name: 'Anil Kumar',
    staffId: 'STF118',
    department: 'Physics',
    year: '1st Year',
    section: 'B',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 't3',
    name: 'Divya Francis',
    staffId: 'STF076',
    department: 'Administration',
    year: '2nd Year',
    section: 'A',
    deviceStatus: 'Not Connected',
    isBlocked: false,
  },
  {
    id: 't4',
    name: 'Ramesh Subin',
    staffId: 'STF152',
    department: 'Sports',
    year: '2nd Year',
    section: 'C',
    deviceStatus: 'Connected',
    isBlocked: true,
  },
  {
    id: 't5',
    name: 'Lakshmi Iyer',
    staffId: 'STF093',
    department: 'Chemistry',
    year: '3rd Year',
    section: 'B',
    deviceStatus: 'Connected',
    isBlocked: false,
  },
  {
    id: 't6',
    name: 'Suresh Nambiar',
    staffId: 'STF061',
    department: 'Computer Science',
    year: '4th Year',
    section: 'A',
    deviceStatus: 'Not Connected',
    isBlocked: false,
  },
];

const getInitials = (name) =>
  name.split(' ').map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();

const StaffScreen = () => {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  const yearOptions = useMemo(() => ['All', ...YEARS], []);
  const sectionOptions = useMemo(
    () => ['All', ...getSectionOptions(selectedYear)],
    [selectedYear],
  );

  // If switching years makes the currently selected section unavailable
  // (e.g. a year configured with fewer sections), reset it back to "All".
  useEffect(() => {
    if (selectedSection !== 'All' && !sectionOptions.includes(selectedSection)) {
      setSelectedSection('All');
    }
  }, [sectionOptions, selectedSection]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'All' || member.year === selectedYear;
      const matchesSection = selectedSection === 'All' || member.section === selectedSection;
      return matchesSearch && matchesYear && matchesSection;
    });
  }, [staff, searchQuery, selectedYear, selectedSection]);

  const handleToggleBlock = (staffId) => {
    setStaff((prev) =>
      prev.map((member) =>
        member.id === staffId ? { ...member, isBlocked: !member.isBlocked } : member,
      ),
    );
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search staff"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.filterLabel}>Year</Text>
        <FilterChipGroup
          options={yearOptions}
          selectedValue={selectedYear}
          onSelect={setSelectedYear}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.filterLabel}>Section</Text>
        <FilterChipGroup
          options={sectionOptions}
          selectedValue={selectedSection}
          onSelect={setSelectedSection}
        />
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
          subtitle="Tap Block or Unblock to manage device access"
        />
        {filteredStaff.length === 0 ? (
          <Text style={styles.emptyText}>No staff match your filters.</Text>
        ) : (
          filteredStaff.map((member) => (
            <PersonRecordCard
              key={member.id}
              avatarText={getInitials(member.name)}
              avatarColor={colors.skyBlue}
              name={member.name}
              idLabel="Staff ID"
              idValue={member.staffId}
              department={member.department}
              year={member.year}
              section={member.section}
              deviceStatus={member.deviceStatus}
              isBlocked={member.isBlocked}
              onToggleBlock={() => handleToggleBlock(member.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  filterLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default StaffScreen;