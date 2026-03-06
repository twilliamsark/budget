import { Category } from './category.model';

describe('Category model', () => {
  it('should use id as the identifier', () => {
    const category: Category = { id: 'Food' };
    expect(category.id).toBe('Food');
  });
});
