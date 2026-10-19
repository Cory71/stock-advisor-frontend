import { describe, it, expect } from 'vitest';
import { emailMatches, exportFileName, dataReport } from './account';

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
    expect(exportFileName(new Date('2026-10-19T12:00:00Z'))).to.equal('stockgrader-data-2026-10-19.pdf');
  });
});

describe('dataReport', () => {
  const data = {
    exportedAt: '2026-10-19T15:15:00Z',
    account: {
      email: 'cory@example.com',
      displayName: null,
      createdAt: '2026-09-01T10:00:00Z',
      signInMethods: { password: true, google: true },
    },
    watchlist: [{ ticker: 'AAPL', gradeWhenAdded: 'B', addedAt: '2026-10-01T09:00:00Z' }],
    searchHistory: [],
  };
  const report = () => dataReport(data, { timeZone: 'UTC' });

  it('titles the report and dates the export', () => {
    expect(report().title).to.equal('Your StockGrader data');
    expect(report().exportedOn).to.equal('Exported Oct 19, 2026, 3:15 PM');
  });

  // Dates and sign-in methods are written for people, not as raw data.
  it('writes the account details in plain words', () => {
    const [account] = report().sections;
    expect(account.rows).to.deep.equal([
      ['Email', 'cory@example.com'],
      ['Display name', 'Not set'],
      ['Account created', 'Sep 1, 2026'],
      ['Sign-in methods', 'Email and password and Google'],
    ]);
  });

  it('lists the watchlist with a count in the heading', () => {
    const watchlist = report().sections[1];
    expect(watchlist.heading).to.equal('Watchlist (1)');
    expect(watchlist.rows).to.deep.equal([['AAPL', 'B', 'Oct 1, 2026']]);
  });

  it('says so when a section has nothing in it', () => {
    const history = report().sections[2];
    expect(history.rows).to.deep.equal([]);
    expect(history.empty).to.equal('No searches saved.');
  });
});
