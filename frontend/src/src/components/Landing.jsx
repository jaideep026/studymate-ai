export default function Landing({ onGetStarted }) {
  const features = [
    {
      title: "Upload your notes",
      body: "Paste in notes with a title. They're chunked and prepared for retrieval automatically.",
    },
    {
      title: "Ask in plain English",
      body: "Ask a question the way you'd ask a classmate. No special syntax or keywords needed.",
    },
    {
      title: "Get grounded answers",
      body: "Answers are generated only from your own notes, with the source passages shown alongside.",
    },
  ];

  return (
    <div className="landing">
      <section className="hero">
        <h1>StudyMate AI</h1>
        <p className="hero-sub">Upload your notes. Ask questions. Get answers grounded in what you actually wrote.</p>
        <button className="cta" onClick={onGetStarted}>
          Get started — it's free
        </button>
      </section>

      <section className="feature-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <p>Built by Jaideep Kommineni · Full-stack MERN + Retrieval-Augmented Generation</p>
      </footer>
    </div>
  );
}
