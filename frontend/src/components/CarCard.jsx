import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './icons';

export default function CarCard({ car }) {
  return (
    <Link to={`/cars/${car.id}`} className="car-card">
      <div className="car-card-image">
        {car.image?.url ? (
          <img src={car.image.url} alt={`${car.make} ${car.model}`} />
        ) : (
          <span className="car-card-placeholder">Car image unavailable</span>
        )}
      </div>
      <div className="car-card-body">
        <div className="car-card-make">{car.make}</div>
        <div className="car-card-model">{car.model}</div>
        <div className="car-card-meta">
          {[car.year, car.country].filter(Boolean).join(' · ') || car.bodyType}
        </div>
        <span className="car-card-link">View Details <ArrowRightIcon className="icon icon-sm" /></span>
      </div>
    </Link>
  );
}
