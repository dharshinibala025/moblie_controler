/**
 * Jest setup — mock react-native-vector-icons native modules so the RN app
 * renders in the Jest (react-test-renderer) environment.
 */

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('react-native-vector-icons/FontAwesome6', () => 'FontAwesome6');
