export default function Privacy() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Privacy Policy</h2>
      <p><strong>Last updated:</strong> {new Date().toISOString().slice(0,10)}</p>

      <h3>What we collect</h3>
      <ul>
        <li>Agency data (name, email, phone, location).</li>
        <li>Car listing data (specs, price, photos).</li>
        <li>Customer booking data (name, phone, optional email, chosen dates).</li>
        <li>Basic analytics / logs to keep the service secure and reliable.</li>
      </ul>

      <h3>How we use it</h3>
      <ul>
        <li>To operate the marketplace and forward booking requests to agencies.</li>
        <li>To respond to support and improve the service.</li>
      </ul>

      <h3>Sharing</h3>
      <p>Customer booking details are shared with the selected agency. We don’t sell your data.</p>

      <h3>Retention</h3>
      <p>We keep data as long as needed to operate the service and comply with law.</p>

      <h3>Your choices</h3>
      <p>Agencies can delete their account and cars from the Account page. For other requests, contact support@vilis.app (example).</p>

      <h3>Changes</h3>
      <p>We may update this policy by posting a new version here.</p>
    </div>
  );
}
