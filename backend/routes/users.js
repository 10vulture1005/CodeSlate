import express from 'express';
import User from '../models/usermodel.js';
import {saveUser} from '../controller/usercontroller.js'
const router = express.Router();
router.post('/',saveUser)

export default router;
