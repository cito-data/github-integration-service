import { Router } from 'express';

const githubRoutes = Router();


githubRoutes.post('/webhooks', (req, res) => {
    console.log(req);
    const {body} = req;
    console.log(body);
  
    res.send('success with smee');
    
});


export default githubRoutes;
