import { describe, it, expect } from 'vitest';
import { refreshLabel, refreshFailureMessage } from './refreshProgress';

describe('refreshLabel', () => {
  it('counts from 1 before any row has finished', () => {
    expect(refreshLabel({ done: 0, total: 30 })).to.equal('Refreshing 1 of 30…');
  });

  it('shows the row currently being worked on', () => {
    expect(refreshLabel({ done: 11, total: 30 })).to.equal('Refreshing 12 of 30…');
  });

  it('never counts past the total on the last row', () => {
    expect(refreshLabel({ done: 30, total: 30 })).to.equal('Refreshing 30 of 30…');
  });

  it('falls back to plain text when there is nothing to count', () => {
    expect(refreshLabel(null)).to.equal('Refreshing…');
    expect(refreshLabel({ done: 0, total: 0 })).to.equal('Refreshing…');
  });
});

describe('refreshFailureMessage', () => {
  it('says nothing when every row refreshed', () => {
    expect(refreshFailureMessage(0, 12)).to.equal(null);
  });

  it('reports a partial failure without alarming the user', () => {
    expect(refreshFailureMessage(2, 12)).to.equal(
      '2 of 12 couldn\'t be refreshed right now — the rest are up to date.'
    );
  });

  it('asks the user to retry when nothing refreshed', () => {
    expect(refreshFailureMessage(12, 12)).to.match(/try again/i);
  });
});
