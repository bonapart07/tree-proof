// Indian States and Comprehensive Districts Database

export interface StateDistrictMap {
  state: string;
  districts: string[];
}

export const INDIAN_STATES_DISTRICTS: StateDistrictMap[] = [
  {
    state: 'Assam',
    districts: [
      'Kamrup Metropolitan (Guwahati)',
      'Kamrup Rural',
      'Dibrugarh',
      'Jorhat',
      'Cachar (Silchar)',
      'Sonitpur (Tezpur)',
      'Nagaon',
      'Tinsukia',
      'Golaghat',
      'Sivasagar',
      'Barpeta',
      'Dhubri',
      'Goalpara',
      'Bongaigaon',
      'Darrang (Mangaldai)',
      'Morigaon',
      'Karbi Anglong (Diphu)',
      'Dima Hasao (Haflong)',
      'Kokrajhar',
      'Chirang',
      'Baksa',
      'Udalguri',
      'Lakhimpur (North Lakhimpur)',
      'Dhemaji',
      'Karimganj',
      'Hailakandi',
      'Biswanath',
      'Charaideo',
      'Hojai',
      'South Salmara-Mankachar',
      'Majuli (River Island)',
      'West Karbi Anglong',
      'Bajali',
      'Tamulpur'
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      'Mumbai City',
      'Mumbai Suburban',
      'Pune',
      'Nagpur',
      'Thane',
      'Nashik',
      'Aurangabad (Chhatrapati Sambhajinagar)',
      'Solapur',
      'Kolhapur',
      'Amravati',
      'Satara',
      'Ratnagiri',
      'Raigad',
      'Sindhudurg',
      'Ahmednagar'
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Mysuru',
      'Dakshina Kannada (Mangaluru)',
      'Belagavi',
      'Hubballi-Dharwad',
      'Shimoga (Shivamogga)',
      'Tumakuru',
      'Udupi',
      'Kodagu (Coorg)',
      'Chikkamagaluru',
      'Ballari'
    ]
  },
  {
    state: 'Tamil Nadu',
    districts: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Tirunelveli',
      'Nilgiris (Ooty)',
      'Kanyakumari',
      'Thanjavur',
      'Vellore',
      'Erode',
      'Dindigul'
    ]
  },
  {
    state: 'West Bengal',
    districts: [
      'Kolkata',
      'North 24 Parganas',
      'South 24 Parganas (Sundarbans)',
      'Howrah',
      'Darjeeling',
      'Jalpaiguri',
      'Alipurduar',
      'Murshidabad',
      'Paschim Medinipur',
      'Bankura',
      'Purba Bardhaman'
    ]
  },
  {
    state: 'Meghalaya',
    districts: [
      'East Khasi Hills (Shillong)',
      'West Khasi Hills',
      'South West Khasi Hills',
      'Ri-Bhoi',
      'West Garo Hills (Tura)',
      'East Garo Hills',
      'South Garo Hills',
      'West Jaintia Hills (Jowai)',
      'East Jaintia Hills'
    ]
  },
  {
    state: 'Arunachal Pradesh',
    districts: [
      'Papum Pare (Itanagar)',
      'Changlang',
      'West Kameng (Tawang route)',
      'East Kameng',
      'Lower Subansiri (Ziro)',
      'Upper Subansiri',
      'East Siang (Pasighat)',
      'West Siang',
      'Lohit',
      'Tirap'
    ]
  },
  {
    state: 'Kerala',
    districts: [
      'Thiruvananthapuram',
      'Kochi (Ernakulam)',
      'Kozhikode',
      'Wayanad',
      'Idukki',
      'Palakkad',
      'Thrissur',
      'Kottayam',
      'Alappuzha',
      'Kannur'
    ]
  },
  {
    state: 'Delhi (NCT)',
    districts: [
      'Central Delhi',
      'New Delhi',
      'South Delhi',
      'South West Delhi (Aravalli)',
      'North Delhi',
      'North East Delhi',
      'North West Delhi',
      'East Delhi',
      'West Delhi'
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      'Lucknow',
      'Noida (Gautam Buddha Nagar)',
      'Ghaziabad',
      'Varanasi',
      'Agra',
      'Kanpur Nagar',
      'Prayagraj',
      'Gorakhpur',
      'Bareilly',
      'Meerut'
    ]
  },
  {
    state: 'Gujarat',
    districts: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Gir Somnath (Gir Forest)',
      'Junagadh',
      'Kutch',
      'Gandhinagar',
      'Bhavnagar'
    ]
  },
  {
    state: 'Rajasthan',
    districts: [
      'Jaipur',
      'Udaipur',
      'Jodhpur',
      'Kota',
      'Ajmer',
      'Bikaner',
      'Alwar (Sariska Buffer)',
      'Jaisalmer'
    ]
  }
];

export const DEFAULT_STATE = 'Assam';
export const DEFAULT_DISTRICT = 'Kamrup Metropolitan (Guwahati)';

export function getDistrictsForState(stateName: string): string[] {
  const match = INDIAN_STATES_DISTRICTS.find(
    (s) => s.state.toLowerCase() === stateName.toLowerCase()
  );
  return match ? match.districts : ['Central District', 'North District', 'South District'];
}
