import Hero from './components/Hero';
import DaySection from './components/DaySection';
import tripData from './data/tripData';
import './App.css';

function App() {
  return (
    <div className="app">
      <Hero />
      {tripData.map((day) => (
        <DaySection key={day.id} dayData={day} />
      ))}
    </div>
  );
}

export default App;
