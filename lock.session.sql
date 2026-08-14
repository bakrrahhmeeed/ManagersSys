            SELECT

            t.TaskID,

            t.ProjectID,

            t.StageID,

            t.TaskTitle,

            t.TaskDescription,

            t.AssignedTo,

            u.FullName AS AssignedTo,

            t.PriorityLevel AS PriorityLevel,

            t.Status,

            t.ProgressPercent,

            t.DueDate,

            t.CompletedDate,

            t.Blocker,

            t.CreatedBy,

            t.CreatedAt,

            s.StageName,

            p.ProjectName

        FROM ProjectTasks t

        LEFT JOIN Users u

            ON t.AssignedTo = u.UserID

        LEFT JOIN ProjectStages s

            ON t.StageID = s.StageID

        LEFT JOIN Projects p

            ON t.ProjectID = p.ProjectID

        ORDER BY t.TaskID DESC








