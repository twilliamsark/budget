import { Account } from './account.model';

describe('Account model', () => {
  it('should use id as the identifier', () => {
    const account: Account = { id: 'CC-5792', type: 'liability' };
    expect(account.id).toBe('CC-5792');
  });
});
