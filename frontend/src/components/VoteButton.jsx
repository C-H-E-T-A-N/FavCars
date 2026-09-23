import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVoteStatus, voteForCar, googleLoginUrl } from '../services/api';

/** Reports the vote result back up via onVoted({ voteCount, rank }) so the page can update
 *  votes/rank live without a full reload - the backend/Redis response is the only source of truth. */
export default function VoteButton({ carId, onVoted }) {
  const { user, loading: authLoading } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    setChecking(true);
    getVoteStatus(carId)
      .then((res) => setHasVoted(res.hasVoted))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [carId, user, authLoading]);

  const handleVote = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await voteForCar(carId);
      setHasVoted(true);
      onVoted?.({ voteCount: res.voteCount, rank: res.rank });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setHasVoted(true);
        setError('You have already voted for this car.');
      } else if (status === 401) {
        setError('Sign in with Google to vote.');
      } else if (status === 404) {
        setError('This car could not be found.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return <button className="vote-button" disabled>Loading…</button>;
  }

  if (!user) {
    return (
      <>
        <a className="vote-button" href={googleLoginUrl}>❤️ Vote for this car</a>
        <p className="vote-hint">Sign in with Google to vote.</p>
      </>
    );
  }

  if (hasVoted) {
    return (
      <>
        <button className="vote-button voted" disabled>✓ VOTED</button>
        {error && <p className="vote-error">{error}</p>}
      </>
    );
  }

  return (
    <>
      <button className="vote-button" onClick={handleVote} disabled={submitting}>
        {submitting ? 'Voting…' : '❤️ VOTE FOR THIS CAR'}
      </button>
      {error && <p className="vote-error">{error}</p>}
    </>
  );
}
