import Hero from './components/Hero';
import DaySection from './components/DaySection';
import Footer from './components/Footer';
import tripData from './data/tripData';
import './App.css';

function App() {
  return (
    <div className="app">
      <Hero />
      {tripData.map((day) => (
        <DaySection key={day.id} dayData={day} />
      ))}
      <Footer />
    </div>
  );
}

export default App;
