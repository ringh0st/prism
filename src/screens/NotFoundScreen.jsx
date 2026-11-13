import Button from '../components/Button.jsx';

export default function NotFoundScreen() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', gap: 16, minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
      <h1>Nothing to see here</h1>
      <p>This level doesn’t exist, or it hasn’t been published yet.</p>
      <Button as="a" href="#/">
        Back to the map
      </Button>
    </main>
  );
}
