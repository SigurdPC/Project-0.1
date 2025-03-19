export interface BunkeringOperation {
  id: string;
  date: string;
  fuelType: string;
  density: number;
  timeStart: string;
  timeStop: string;
  received: number;
}

export interface DailyEvent {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  origin: string;
  destination: string;
  operationType: string;
  consumptionME: number;
  consumptionAE: number;
}

export interface DailyROB {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  origin: string;
  destination: string;
  operationType: string;
  consumptionME: number;
  consumptionAE: number;
}

export interface DPHours {
  id: string;
  date: string;
  location: string;
  time: string;
  event: string;
} 