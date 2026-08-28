import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';

const API_URL = 'http://localhost:4000';
const SERVICE_FEE = 70;

const towns = [
  'Kakamega',
  'Kitale',
  'Eldoret',
  'Webuye',
  'Bungoma',
  'Kapenguria',
  'Nairobi',
  'Lodwar',
  'Kisumu',
  'Nakuru',
  'Homa Bay',
  'Kisii',
  'Migori',
  'Mombasa',
  'Malindi',
  'Nanyuki',
  'Meru',
  'Embu',
  'Nyeri',
  'Busia',
];

export default function App() {
  const [from, setFrom] = useState('Kakamega');
  const [to, setTo] = useState('Kitale');
  const [fare, setFare] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [loadingFare, setLoadingFare] = useState(false);
  const [booking, setBooking] = useState(null);

  const count = Number(passengers) || 1;
  const total = fare !== null ? (fare + SERVICE_FEE) * count : 0;

  useEffect(() => {
    if (from === to) {
      setFare(null);
      return;
    }

    async function getFare() {
      setLoadingFare(true);

      try {
        const response = await fetch(
          `${API_URL}/api/fare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setFare(null);
          return;
        }

        setFare(Number(data.fare));
      } catch (error) {
        setFare(null);
      } finally {
        setLoadingFare(false);
      }
    }

    getFare();
  }, [from, to]);

  async function book() {
    if (!name.trim() || !phone.trim()) {
      return Alert.alert(
        'Missing details',
        'Enter passenger name and phone number.'
      );
    }

    if (from === to) {
      return Alert.alert(
        'Invalid route',
        'From and To cannot be the same.'
      );
    }

    if (fare === null) {
      return Alert.alert(
        'Fare unavailable',
        'The fare for this route is not configured yet.'
      );
    }

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainTown: from,
          from,
          to,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          passengerName: name.trim(),
          phone: phone.trim(),
          passengers: count,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBooking(data);
    } catch (error) {
      Alert.alert(
        'Booking failed',
        error.message || 'Could not save the booking.'
      );
    }
  }

  if (booking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.card}>
          <Text style={s.tick}>?</Text>
          <Text style={s.title}>Booking Confirmed</Text>

          <Text style={s.code}>{booking.bookingNo}</Text>

          <Text style={s.line}>
            Passenger: <Text style={s.bold}>{booking.passengerName}</Text>
          </Text>

          <Text style={s.line}>
            Route: {booking.from} ? {booking.to}
          </Text>

          <Text style={s.line}>
            Passengers: {booking.passengers}
          </Text>

          <Text style={s.line}>
            Fare: KSh {(booking.fare * booking.passengers).toLocaleString()}
          </Text>

          <Text style={s.line}>
            Service fee: KSh{' '}
            {(booking.serviceFee * booking.passengers).toLocaleString()}
          </Text>

          <Text style={s.total}>
            Total: KSh {booking.total.toLocaleString()}
          </Text>

          <Pressable
            style={s.button}
            onPress={() => {
              setBooking(null);
              setName('');
              setPhone('');
              setPassengers('1');
            }}
          >
            <Text style={s.bt}>NEW BOOKING</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.card}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Text style={s.logoText}>QS</Text>
            </View>

            <View>
              <Text style={s.titleLeft}>Quick Shuttle</Text>
              <Text style={s.sub}>Book your trip in seconds.</Text>
            </View>
          </View>

          <View style={s.ad}>
            <Text>ADVERTISEMENT</Text>
          </View>

          <Text style={s.label}>From</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.townScroll}
          >
            {towns.map((town) => (
              <Pressable
                key={town}
                style={[s.townButton, from === town && s.selectedTown]}
                onPress={() => setFrom(town)}
              >
                <Text
                  style={[
                    s.townText,
                    from === town && s.selectedTownText,
                  ]}
                >
                  {town}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={s.selectedLabel}>From: {from}</Text>

          <Text style={s.label}>To</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.townScroll}
          >
            {towns.map((town) => (
              <Pressable
                key={town}
                style={[s.townButton, to === town && s.selectedTown]}
                onPress={() => setTo(town)}
              >
                <Text
                  style={[
                    s.townText,
                    to === town && s.selectedTownText,
                  ]}
                >
                  {town}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={s.selectedLabel}>To: {to}</Text>

          <View style={s.fareBox}>
            {from === to ? (
              <Text style={s.errorText}>
                From and To cannot be the same.
              </Text>
            ) : loadingFare ? (
              <Text>Checking fare...</Text>
            ) : fare === null ? (
              <Text style={s.errorText}>
                Fare not configured for this route.
              </Text>
            ) : (
              <>
                <Text>
                  Fare per passenger: KSh {fare.toLocaleString()}
                </Text>

                <Text>
                  Quick Shuttle fee: KSh{' '}
                  {SERVICE_FEE.toLocaleString()} per passenger
                </Text>

                <Text style={s.total}>
                  Total: KSh {total.toLocaleString()}
                </Text>
              </>
            )}
          </View>

          <Text style={s.label}>Passenger name</Text>

          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
          />

          <Text style={s.label}>Phone number</Text>

          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Passengers</Text>

          <TextInput
            style={s.input}
            value={passengers}
            onChangeText={setPassengers}
            keyboardType="numeric"
          />

          <Pressable style={s.button} onPress={book}>
            <Text style={s.bt}>BOOK NOW</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#eef4f8',
  },

  wrap: {
    padding: 14,
    flexGrow: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 21,
    elevation: 4,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0b6bcb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },

  titleLeft: {
    fontSize: 24,
    fontWeight: '900',
  },

  title: {
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },

  sub: {
    color: '#667085',
    marginTop: 3,
  },

  ad: {
    height: 55,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b9c5cf',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  label: {
    fontWeight: '700',
    marginTop: 13,
    marginBottom: 6,
  },

  selectedLabel: {
    marginTop: 8,
    fontWeight: '700',
  },

  townScroll: {
    marginBottom: 3,
  },

  townButton: {
    borderWidth: 1,
    borderColor: '#c9d3dc',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginRight: 8,
  },

  selectedTown: {
    backgroundColor: '#0b6bcb',
    borderColor: '#0b6bcb',
  },

  townText: {
    fontWeight: '600',
  },

  selectedTownText: {
    color: '#fff',
  },

  input: {
    borderWidth: 1,
    borderColor: '#c9d3dc',
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
  },

  fareBox: {
    backgroundColor: '#f5f8fa',
    padding: 14,
    borderRadius: 11,
    marginTop: 18,
    gap: 8,
  },

  total: {
    fontWeight: '900',
    fontSize: 18,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dbe2e7',
    paddingTop: 10,
  },

  errorText: {
    color: '#b42318',
    fontWeight: '700',
  },

  button: {
    backgroundColor: '#0b6bcb',
    borderRadius: 11,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  bt: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },

  tick: {
    fontSize: 40,
    textAlign: 'center',
    color: '#18864b',
  },

  code: {
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
    color: '#0b6bcb',
    margin: 10,
  },

  line: {
    fontSize: 16,
    marginVertical: 7,
  },

  bold: {
    fontWeight: '800',
  },
});
