GRANT ALL ON public.admins TO service_role;
GRANT ALL ON public.volunteers TO service_role;
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.requests TO service_role;

INSERT INTO public.organizations (id, org_name, registration_number, contact_person, contact_phone, email, area_of_operation, resources_available, approval_status, location_lat, location_lng) VALUES
('11111111-1111-4111-8111-000000000001','Vadodara Relief Trust','GJ/REG/2011/4421','Meera Shah','+91 98250 11221','contact@vrtrust.org','Vadodara city','2 boats, 40 food kits, medical camp','approved',22.3072,73.1812),
('11111111-1111-4111-8111-000000000002','Narmada Seva Foundation','GJ/REG/2015/7781','Rakesh Patel','+91 98790 33445','help@narmadaseva.org','Bharuch & Ankleshwar','Ambulance, dry rations, tents','approved',21.7051,72.9959),
('11111111-1111-4111-8111-000000000003','Saurashtra Rescue Corps','GJ/REG/2009/1102','Jignesh Vora','+91 99045 66112','ops@srcorps.in','Rajkot region','6 rescue divers, 3 inflatable boats','approved',22.3039,70.8022),
('11111111-1111-4111-8111-000000000004','Amdavad Health Aid','GJ/REG/2018/9931','Dr. Anita Desai','+91 98240 77553','care@ahealthaid.org','Ahmedabad','Mobile clinic, 4 doctors, medicines','approved',23.0225,72.5714),
('11111111-1111-4111-8111-000000000005','Surat Flood Response Network','GJ/REG/2021/5510','Hiren Mehta','+91 97250 44118','info@sfrn.org','Surat','Boats, shelter for 200, kitchen','pending_approval',21.1702,72.8311),
('11111111-1111-4111-8111-000000000006','Anand Gram Sahay Samiti','GJ/REG/2019/3320','Priya Joshi','+91 94260 88110','samiti@anandgram.org','Anand & Kheda villages','Tractors, 25 volunteers, food','pending_approval',22.5645,72.9289);

INSERT INTO public.volunteers (id, signup_type, name, contact_phone, member_count, skills, location_lat, location_lng, status) VALUES
('22222222-2222-4222-8222-000000000001','individual','Kunal Trivedi','+91 98251 20014',NULL,'{medical,general}',22.3145,73.1750,'available'),
('22222222-2222-4222-8222-000000000002','individual','Sneha Rana','+91 99094 33210',NULL,'{medical}',22.2990,73.2005,'available'),
('22222222-2222-4222-8222-000000000003','group','Alkapuri Youth Rescue','+91 98980 55123',12,'{boat,rescue,general}',22.3110,73.1670,'available'),
('22222222-2222-4222-8222-000000000004','individual','Imran Shaikh','+91 97230 66781',NULL,'{boat,rescue}',22.3260,73.1935,'busy'),
('22222222-2222-4222-8222-000000000005','group','Karelibaug Seva Team','+91 96010 22345',8,'{general}',22.3245,73.2090,'available'),
('22222222-2222-4222-8222-000000000006','individual','Devanshi Patel','+91 90990 11002',NULL,'{general}',22.2865,73.1580,'available'),
('22222222-2222-4222-8222-000000000007','group','Narmada Divers Unit','+91 94270 78900',6,'{rescue,boat}',21.7120,72.9880,'available'),
('22222222-2222-4222-8222-000000000008','individual','Dr. Sameer Bhatt','+91 98240 90011',NULL,'{medical}',23.0180,72.5790,'available'),
('22222222-2222-4222-8222-000000000009','individual','Nita Chauhan','+91 99798 45671',NULL,'{general,medical}',22.3020,70.8100,'available'),
('22222222-2222-4222-8222-000000000010','group','Surat Boat Brigade','+91 97370 55432',15,'{boat,rescue}',21.1755,72.8290,'available');

INSERT INTO public.requests (reporter_name, reporter_phone, relationship, location_lat, location_lng, landmark, description, category, urgency, status, created_at) VALUES
('Ramesh Solanki','+91 98251 44120','self',22.3121,73.1795,'Behind Sama water tank','Water has entered the ground floor, four of us including an elderly woman are stuck on the first floor. Need a boat urgently.','rescue','critical','pending', now() - interval '18 minutes'),
('Hetal Parmar','+91 99098 33110','relative',22.3208,73.2011,'Karelibaug main road','My father is diabetic and out of insulin since yesterday, roads are flooded.','medical','high','pending', now() - interval '42 minutes'),
('Ashok Yadav','+91 97250 11223','neighbour',22.2955,73.1662,'Near Akota bridge','Family of six without food or drinking water for a day.','food','high','assigned', now() - interval '1 hour 20 minutes'),
('Sunita Rao','+91 96380 55221','self',22.3301,73.1840,'Nizampura society gate','Roof is leaking badly and walls are cracking, we need a safe shelter tonight.','shelter','medium','pending', now() - interval '2 hours'),
('Kiran Makwana','+91 94280 66112','self',22.2810,73.2130,'Vasna Road','Elderly couple alone at home, water rising fast in the lane.','rescue','critical','en_route', now() - interval '35 minutes'),
('Pooja Desai','+91 90163 77112','other',22.3390,73.1600,'Chhani jakat naka','Stray cattle and two dogs trapped on an island of road, need help moving them.','general','low','pending', now() - interval '3 hours'),
('Mahesh Bhoi','+91 98795 22110','relative',22.3050,73.2200,'Waghodia road cross','My brother fell and injured his leg, cannot walk, ambulance not reaching.','medical','critical','pending', now() - interval '12 minutes'),
('Farida Vohra','+91 97120 88320','self',22.2740,73.1490,'Tandalja','Baby formula and clean water needed for a 6 month old.','food','high','pending', now() - interval '55 minutes'),
('Jayesh Patel','+91 99250 41100','self',21.7080,72.9910,'Bharuch old town','Ground floor submerged, shifted to terrace with 3 children.','rescue','critical','assigned', now() - interval '2 hours 10 minutes'),
('Bhavna Shah','+91 98240 12000','neighbour',23.0260,72.5680,'Paldi crossing','Elderly neighbour needs dialysis, transport is blocked.','medical','high','pending', now() - interval '4 hours'),
('Rohit Zala','+91 99045 33001','self',22.3080,70.8055,'Rajkot Kalawad road','Basement parking flooded, two people trapped in lift lobby.','rescue','critical','en_route', now() - interval '25 minutes'),
('Nilesh Chavda','+91 96870 22119','self',21.1730,72.8350,'Surat Adajan','Need dry rations for 12 families in our chawl.','food','medium','pending', now() - interval '5 hours'),
('Aarti Mistry','+91 94290 66332','relative',22.5610,72.9310,'Anand village road','Grandmother alone in a kutcha house, water at knee level.','rescue','high','pending', now() - interval '1 hour 5 minutes'),
('Sanjay Rathod','+91 97260 55004','self',22.3160,73.1420,'Gotri lake side','Power lines fallen across the street, dangerous for people wading through.','general','high','pending', now() - interval '48 minutes'),
('Manisha Gohil','+91 98980 77441','other',22.2990,73.1880,'Sayajigunj bus stand','About 30 stranded travellers need shelter for the night.','shelter','medium','assigned', now() - interval '6 hours'),
('Vikram Solanki','+91 90999 12345','self',22.3400,73.2250,'Harni airport road','Water receded but house is full of slush, elderly parents need help cleaning and medical check.','general','low','resolved', now() - interval '1 day'),
('Zeenat Khan','+91 99133 66700','relative',22.2880,73.2050,'Manjalpur','Pregnant sister due next week, need standby transport to hospital.','medical','high','pending', now() - interval '3 hours 20 minutes'),
('Dinesh Prajapati','+91 94081 55221','self',22.3230,73.1520,'Subhanpura','Drinking water tanker has not reached for two days, 20 households affected.','food','medium','pending', now() - interval '7 hours');