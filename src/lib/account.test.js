import { describe, it, expect } from 'vitest';
import { emailMatches, exportFileName } from './account';

describe('emailMatches', () => {
  it('matches the account email exactly', () => {
    expect(emailMatches('cory@example.com', 'cory@example.com')).to.equal(true);
  });

  it('ignores case and surrounding spaces', () => {
    expect(emailMatches('  Cory@Example.COM ', 'cory@example.com')).to.equal(true);
  });

  it('rejects anything else', () => {
    expect(emailMatches('cory@example.co', 'cory@example.com')).to.equal(false);
    expect(emailMatches('', 'cory@example.com')).to.equal(false);
    expect(emailMatches(undefined, 'cory@example.com')).to.equal(false);
    expect(emailMatches('cory@example.com', null)).to.equal(false);
  });
});

describe('exportFileName', () => {
  it('dates the file so repeated exports do not overwrite each other', () => {
    expect(exportFileName(new Date('2026-10-19T12:00:00Z'))).to.equal('stockgrader-data-2026-10-19.json');
  });
});
