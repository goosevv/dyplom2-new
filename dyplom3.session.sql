UPDATE users SET role_id = (SELECT id FROM roles WHERE name='admin') 
  WHERE email='danilogusev.gus@gmail.com'; 
