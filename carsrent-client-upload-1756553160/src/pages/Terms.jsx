export default function Terms() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Terms of Service</h2>
      <p><strong>Last updated:</strong> {new Date().toISOString().slice(0,10)}</p>

      <h3>1. Service</h3>
      <p>Vilis is a marketplace where rental agencies list cars and customers submit booking requests.
         Vilis does not own the cars and is not a party to rental contracts between customers and agencies.</p>

      <h3>2. Accounts</h3>
      <p>Agencies must provide accurate information. You’re responsible for safeguarding your login.</p>

      <h3>3. Listings & Pricing</h3>
      <p>Agencies set their own prices and descriptions. Taxes, deposits, and other fees (if any) are set by agencies.</p>

      <h3>4. Requests & Communication</h3>
      <p>Booking requests are forwarded to the agency. Confirmation, payment, and the rental agreement happen directly with the agency.</p>

      <h3>5. Prohibited Use</h3>
      <p>No illegal activity, spam, or attempts to break or scrape the service.</p>

      <h3>6. Liability</h3>
      <p>The service is provided “as is.” To the fullest extent permitted by law, Vilis is not liable for indirect or incidental damages.</p>

      <h3>7. Changes</h3>
      <p>We may update these terms by posting a new version here.</p>

      <h3>8. Contact</h3>
      <p>Questions? Email: support@vilis.app (example)</p>
    </div>
  );
}
