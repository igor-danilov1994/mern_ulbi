import File from '../models/File.js'
import fileService from '../serveces/fileService.js'
import User from "../models/User.js";
import fs from "fs";

const FILES_PATH = '/Users/igordanilov/Desktop/courses/mern_ulbi/server/files';

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            const file = await new File({name, type, parent, user: req.user.id})
            const parentFile = await File.findOne({_id: parent})

            if (!parentFile) {
                file.path = name
            } else {
                file.path = parentFile.path ? `${parentFile.path}/${file.name}` : file.name
                parentFile.childs.push(file._id)
                await parentFile.save()
            }

            await fileService.createDir(file)
            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query
            let files
            const filter = {user: req.user.id, parent: req.query.parent}

            switch (sort) {
                case 'name':
                    files = await File.find(filter).sort({name: 1})
                    break
                case 'type':
                    files = await File.find(filter).sort({type: 1})
                    break
                case 'date':
                    files = await File.find(filter).sort({date: 1})
                    break
                default:
                    files = await File.find(filter)
                    break
            }
            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: "Can not get files"})
        }
    }

    async uploadFile(req, res) {
        try {
            const file = req.files.file
            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})

            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({
                    message: 'There no space on the disk'
                })

            }
            user.usedSpace = file.size + user.usedSpace

            let path;
            if (parent) {
                path = `${FILES_PATH}/${user._id}/${parent.path}/${file.name}`
            } else {
                path = `${FILES_PATH}/${user._id}/${file.name}`
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'File already exist'})
            }

            file.mv(path)

            const type = file.name.split('.').pop()
            let filePath = file.name
            if (parent) {
                filePath = parent.path + '/' + file.name
            }

            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                parent: parent?._id,
                user: user._id
            })

            await dbFile.save()
            await user.save()

            res.status(200).json(dbFile)

        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path = FILES_PATH + `/` + req.user.id + '/' + file.path + '/' + file.name

            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }

            res.status(400).json({message: "Download error"})

        } catch (e) {
            console.log(e)
            res.status(400).json({message: 'Error Download File'})
        }
    }

    async deleteFile(req, res) {
        try {
            const fileId = req.query.id
            const userId = req.user.id
            const file = await File.findOne({_id: fileId, user: userId})

            if (!file) {
                res.status(400).json({message: 'File not found'})
            }

            fileService.deleteFile(file)
            await file.deleteOne()
            return res.status(200).json({message: "File was deleted"})

        } catch (e) {
            console.log(e)
            return res.status(400).json({message: 'Error delete file'})
        }
    }


    async searchFiles(req, res) {
        try {
            const searchName = req.query.search
            let files = await File.find({user: req.user.id})
            files = files.filter(file => file.name.includes(searchName))
            res.status(200).json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'Search error'})
        }
    }
}

export default new FileController()
