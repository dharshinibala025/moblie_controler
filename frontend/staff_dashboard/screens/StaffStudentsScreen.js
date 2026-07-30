import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import { getStudentsForClass } from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffStudentsScreen = ({ staffData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (staffData) {
      setStudents(getStudentsForClass(staffData.assignedClass));
    }
  }, [staffData]);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
        );
      }),
    [students, searchQuery]
  );

  const handleToggleBlock = (student) => {
    const newStatus = student.status === 'blocked' ? 'active' : 'blocked';
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, status: newStatus, online: true, lastSync: 'Just now' }
          : s
      )
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', label: 'Active' };
      case 'blocked':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: 'Blocked' };
      case 'offline':
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', label: 'Offline' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Students</Text>
        <Text style={styles.subtitleText}>
          {staffData?.assignedClass || 'Class'} · {students.length} students
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <VectorIcon name="magnify" size={18} color="#9CA3AF" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or register number..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <VectorIcon name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <VectorIcon name="account-group" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'No students match your search.'
                : 'No students are assigned to your class.'}
            </Text>
          </View>
        ) : (
          filteredStudents.map((student, index) => {
            const statusStyle = getStatusStyle(student.status);
            const isBlocked = student.status === 'blocked';

            return (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfoCol}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>{student.rollNo}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.studentActions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleToggleBlock(student)}
                    style={[
                      styles.blockBtn,
                      isBlocked
                        ? { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }
                        : { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                    ]}
                  >
                    <VectorIcon
                      name={isBlocked ? 'unlock' : 'lock'}
                      size={14}
                      color={isBlocked ? '#16A34A' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.blockBtnText,
                        { color: isBlocked ? '#16A34A' : '#DC2626' },
                      ]}
                    >
                      {isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: STATUSBAR_OFFSET,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 24,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  studentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  studentRoll: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  blockBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StaffStudentsScreen;
