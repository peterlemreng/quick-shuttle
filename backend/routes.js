const routes = [
  {
    id: 'kitale-nairobi',
    from: 'Kitale',
    to: 'Nairobi',
    stops: ['Kitale', 'Webuye', 'Bungoma', 'Eldoret', 'Timboroa', 'Nakuru', 'Naivasha', 'Nairobi']
  },
  {
    id: 'kitale-lodwar',
    from: 'Kitale',
    to: 'Lodwar',
    stops: ['Kitale', 'Kapenguria', 'Kainuk', 'Lokichar', 'Lodwar']
  },
  {
    id: 'kitale-bungoma',
    from: 'Kitale',
    to: 'Bungoma',
    stops: ['Kitale', 'Webuye', 'Bungoma']
  },
  {
    id: 'kitale-kisumu',
    from: 'Kitale',
    to: 'Kisumu',
    stops: ['Kitale', 'Webuye', 'Bungoma', 'Mumias', 'Kakamega', 'Luanda', 'Maseno', 'Kisumu']
  },
  {
    id: 'kisumu-nakuru',
    from: 'Kisumu',
    to: 'Nakuru',
    stops: ['Kisumu', 'Ahero', 'Awasi', 'Muhoroni', 'Fort Ternan', 'Londiani', 'Molo', 'Nakuru']
  },
  {
    id: 'kakamega-nakuru',
    from: 'Kakamega',
    to: 'Nakuru',
    stops: ['Kakamega', 'Mumias', 'Bungoma', 'Webuye', 'Eldoret', 'Timboroa', 'Molo', 'Nakuru']
  },
  {
    id: 'homa-bay-nairobi',
    from: 'Homa Bay',
    to: 'Nairobi',
    stops: ['Homa Bay', 'Rongo', 'Awendo', 'Kisii', 'Keroka', 'Sotik', 'Bomet', 'Narok', 'Mai Mahiu', 'Nairobi']
  },
  {
    id: 'kisii-nairobi',
    from: 'Kisii',
    to: 'Nairobi',
    stops: ['Kisii', 'Keroka', 'Sotik', 'Bomet', 'Narok', 'Mai Mahiu', 'Nairobi']
  },
  {
    id: 'migori-nairobi',
    from: 'Migori',
    to: 'Nairobi',
    stops: ['Migori', 'Awendo', 'Rongo', 'Kisii', 'Keroka', 'Sotik', 'Bomet', 'Narok', 'Mai Mahiu', 'Nairobi']
  },
  {
    id: 'nairobi-mombasa',
    from: 'Nairobi',
    to: 'Mombasa',
    stops: ['Nairobi', 'Athi River', 'Emali', 'Kibwezi', 'Mtito Andei', 'Voi', 'Mariakani', 'Mombasa']
  },
  {
    id: 'nairobi-kisumu',
    from: 'Nairobi',
    to: 'Kisumu',
    stops: ['Nairobi', 'Limuru', 'Naivasha', 'Nakuru', 'Timboroa', 'Kericho', 'Awasi', 'Ahero', 'Kisumu']
  },
  {
    id: 'nairobi-eldoret',
    from: 'Nairobi',
    to: 'Eldoret',
    stops: ['Nairobi', 'Limuru', 'Naivasha', 'Nakuru', 'Timboroa', 'Eldoret']
  },
  {
    id: 'nairobi-kakamega',
    from: 'Nairobi',
    to: 'Kakamega',
    stops: ['Nairobi', 'Limuru', 'Naivasha', 'Nakuru', 'Timboroa', 'Eldoret', 'Webuye', 'Kakamega']
  },
  {
    id: 'nairobi-bungoma',
    from: 'Nairobi',
    to: 'Bungoma',
    stops: ['Nairobi', 'Nakuru', 'Timboroa', 'Eldoret', 'Webuye', 'Bungoma']
  },
  {
    id: 'nairobi-lodwar',
    from: 'Nairobi',
    to: 'Lodwar',
    stops: ['Nairobi', 'Nakuru', 'Eldoret', 'Kitale', 'Kapenguria', 'Kainuk', 'Lokichar', 'Lodwar']
  },
  {
    id: 'mombasa-malindi',
    from: 'Mombasa',
    to: 'Malindi',
    stops: ['Mombasa', 'Kilifi', 'Watamu', 'Malindi']
  },
  {
    id: 'nairobi-nanyuki',
    from: 'Nairobi',
    to: 'Nanyuki',
    stops: ['Nairobi', 'Thika', 'Murang’a', 'Karatina', 'Nanyuki']
  },
  {
    id: 'nairobi-meru',
    from: 'Nairobi',
    to: 'Meru',
    stops: ['Nairobi', 'Thika', 'Sagana', 'Karatina', 'Nanyuki', 'Meru']
  },
  {
    id: 'nairobi-embu',
    from: 'Nairobi',
    to: 'Embu',
    stops: ['Nairobi', 'Thika', 'Sagana', 'Makuyu', 'Embu']
  },
  {
    id: 'nairobi-nyeri',
    from: 'Nairobi',
    to: 'Nyeri',
    stops: ['Nairobi', 'Thika', 'Sagana', 'Karatina', 'Nyeri']
  },
  {
    id: 'kisumu-busia',
    from: 'Kisumu',
    to: 'Busia',
    stops: ['Kisumu', 'Maseno', 'Luanda', 'Mumias', 'Busia']
  },
  {
    id: 'kakamega-busia',
    from: 'Kakamega',
    to: 'Busia',
    stops: ['Kakamega', 'Mumias', 'Busia']
  },
  {
    id: 'eldoret-lodwar',
    from: 'Eldoret',
    to: 'Lodwar',
    stops: ['Eldoret', 'Kitale', 'Kapenguria', 'Kainuk', 'Lokichar', 'Lodwar']
  },
  {
    id: 'eldoret-kisumu',
    from: 'Eldoret',
    to: 'Kisumu',
    stops: ['Eldoret', 'Kapsabet', 'Chavakali', 'Luanda', 'Kisumu']
  },
  {
    id: 'eldoret-nakuru',
    from: 'Eldoret',
    to: 'Nakuru',
    stops: ['Eldoret', 'Burnt Forest', 'Timboroa', 'Molo', 'Nakuru']
  }
];

module.exports = routes;
