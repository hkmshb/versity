import { Request, Response } from 'express';


export default class SchoolController {
  index(req: Request, res: Response) {
    return res.status(200).json({
      status: 'OK',
      message: 'You have reached Versity Server!'
    });
  }

  getSchool(req: Request, res: Response) {
    return res.status(200).json({
      msg: 'Hey, implementation for this is pending...'
    });
  }
}
