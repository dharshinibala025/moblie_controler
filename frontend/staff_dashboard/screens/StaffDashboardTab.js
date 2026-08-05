import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Platform, StatusBar } from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffDashboardTab = () => {
  const [currentTime, setCurrentTime] = useState('');

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formatted = date.toLocaleDateString('en-US', options);
      const parts = formatted.split(', ');
      if (parts.length >= 3) {
        const weekday = parts[0];
        const monthDay = parts[1];
        const yearTime = parts[2].split(' ');
        const year = yearTime[0];
        const timeStr = yearTime.slice(1).join(' ');
        setCurrentTime(`${weekday}, ${monthDay}, ${year} | ${timeStr}`);
      } else {
        setCurrentTime(date.toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const staffInfo = staffMockData.staff;

  const classMapping = {
    'III CSE - A': '3rd Year - A',
    'III CSE - B': '3rd Year - B',
    'III CSE - C': '3rd Year - C',
    'II CSE - A': '2nd Year - A',
    'II CSE - B': '2nd Year - B',
    'II CSE - C': '2nd Year - C',
    'IV CSE - A': 'Final Year - A',
    'IV CSE - B': 'Final Year - B',
    'IV CSE - C': 'Final Year - C',
  };

  const mentorClass = staffInfo.assignedClass;
  const targetSectionKey = mentorClass ? (classMapping[mentorClass] || mentorClass) : null;
  const sectionStudents = targetSectionKey ? (staffMockData.sections[targetSectionKey] || []) : [];

  // Calculate Mentor Class Statistics
  const totalStudents = sectionStudents.length;
  const blockedStudents = sectionStudents.filter((s) => s.status === 'blocked').length;
  const unblockedStudents = sectionStudents.filter((s) => s.status === 'active' || s.status === 'offline').length;

  // Sort students alphabetically by name
  const sortedStudents = [...sectionStudents].sort((a, b) => a.name.localeCompare(b.name));

  // Helper to format assigned class name (e.g. "III CSE - A" -> "3rd Year CSE - Section A")
  const formatClassDisplay = (assignedClass) => {
    if (!assignedClass) return 'No Class Assigned';
    const parts = assignedClass.split(' - ');
    const classPart = parts[0]; // e.g. "III CSE"
    const section = parts[1] || ''; // e.g. "A"

    let yearText = '';
    if (classPart.startsWith('III')) {
      yearText = '3rd Year';
    } else if (classPart.startsWith('II')) {
      yearText = '2nd Year';
    } else if (classPart.startsWith('IV')) {
      yearText = '4th Year';
    } else if (classPart.startsWith('I')) {
      yearText = '1st Year';
    } else {
      yearText = classPart;
    }

    // Extract department if present (e.g., "III CSE" -> "CSE")
    const deptPart = classPart.replace(/^[IVX\s]+/, '').trim(); // Remove Roman numerals

    return `${yearText} ${deptPart} - Section ${section}`;
  };

  const renderStudentItem = ({ item, index }) => {
    const isBlocked = item.status === 'blocked';
    return (
      <View style={styles.studentItem}>
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentRoll}>{item.rollNo}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isBlocked ? '#FEE2E2' : '#DCFCE7' },
          ]}
        >
          <Text style={[styles.statusText, { color: isBlocked ? '#EF4444' : '#16A34A' }]}>
            {isBlocked ? 'Blocked' : 'Unblocked'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Clock */}
      <View style={styles.topBar}>
        <Text style={styles.clockText}>{currentTime || 'Mon, Jul 27, 2026 | 05:30:12 AM'}</Text>
        <Text style={styles.topBarTitle}>Class Dashboard</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mentor Title Card */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeLabel}>CLASS MENTOR CONSOLE</Text>
            <Text style={styles.classNameText}>{formatClassDisplay(mentorClass)}</Text>
            <Text style={styles.staffMetaText}>
              Mentor: {staffInfo.name}  •  Dept: {staffInfo.department}
            </Text>
          </View>
          <View style={styles.classIcon}>
            <VectorIcon name="school" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Students */}
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <View style={styles.statIconContainer}>
              <VectorIcon name="account-group" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>

          {/* Card 2: Blocked count */}
          <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <VectorIcon name="cellphone-off" size={18} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.statValue}>{blockedStudents}</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
          </View>

          {/* Card 3: Unblocked count */}
          <View style={[styles.statCard, { borderLeftColor: '#16A34A' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <VectorIcon name="cellphone" size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.statValue}>{unblockedStudents}</Text>
              <Text style={styles.statLabel}>Unblocked</Text>
            </View>
          </View>
        </View>

        {/* Alphabetical Student Directory */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitleText}>My Class Student Directory</Text>
          <Text style={styles.listSubtitleText}>Class students listed in alphabetical order.</Text>

          {sectionStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VectorIcon name="account-off" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitleText}>No Assigned Students</Text>
              <Text style={styles.emptySubtitleText}>No students are assigned to your class.</Text>
            </View>
          ) : (
            <FlatList
              data={sortedStudents}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              style={styles.flatList}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 14,
    ...shadows.medium,
  },
  clockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: borderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.card,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  classNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  staffMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.soft,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  listTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  flatList: {
    marginTop: 4,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  indexContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  studentRoll: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});

export default StaffDashboardTab;
