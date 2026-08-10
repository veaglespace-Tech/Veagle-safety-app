import {
  SERVER_URL, API_URL, TOKEN_KEY,
  RELATIONSHIPS, BLOOD_GROUPS, EMERGENCY_RELATIONS,
} from '../src/utils/constants';

describe('Mobile App Constants Unit Tests', () => {
  it('should define a valid SERVER_URL and API_URL', () => {
    expect(SERVER_URL).toBeDefined();
    expect(typeof SERVER_URL).toBe('string');
    expect(API_URL).toBe(`${SERVER_URL}/api`);
  });

  it('should define correct TOKEN_KEY', () => {
    expect(TOKEN_KEY).toBe('tichi_token');
  });

  it('should have complete RELATIONSHIPS list', () => {
    expect(RELATIONSHIPS).toContain('Sister');
    expect(RELATIONSHIPS).toContain('Mother');
    expect(RELATIONSHIPS).toContain('Father');
    expect(RELATIONSHIPS.length).toBeGreaterThanOrEqual(5);
  });

  it('should have all 8 BLOOD_GROUPS', () => {
    expect(BLOOD_GROUPS).toEqual(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  });

  it('should have valid EMERGENCY_RELATIONS list', () => {
    expect(EMERGENCY_RELATIONS).toContain('Parent');
    expect(EMERGENCY_RELATIONS).toContain('Spouse');
    expect(EMERGENCY_RELATIONS).toContain('Guardian');
  });
});
